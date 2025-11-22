"""
backend/database/db_manager.py
SQLite Database Manager for User/Resource Management
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import os


class DatabaseManager:
    """Manages SQLite database for users, resources, and audit logs"""
    
    def __init__(self, db_path: str = "spl_database.db"):
        """Initialize database connection"""
        self.db_path = db_path
        self.conn = None
        self.create_tables()
    
    def connect(self):
        """Create database connection"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def create_tables(self):
        """Create all necessary tables"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL,
                email TEXT,
                department TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Resources table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS resources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,
                path TEXT NOT NULL,
                description TEXT,
                owner TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner) REFERENCES users(username)
            )
        ''')
        
        # Audit logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                username TEXT NOT NULL,
                action TEXT NOT NULL,
                resource TEXT NOT NULL,
                allowed BOOLEAN NOT NULL,
                reason TEXT,
                ip_address TEXT,
                FOREIGN KEY (username) REFERENCES users(username)
            )
        ''')
        
        # Compiled policies table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compiled_policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                source_code TEXT NOT NULL,
                compiled_json TEXT NOT NULL,
                version INTEGER DEFAULT 1,
                active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT,
                FOREIGN KEY (created_by) REFERENCES users(username)
            )
        ''')
        
        conn.commit()
    
    # ============ USER OPERATIONS ============
    
    def create_user(self, username: str, role: str, email: str = None, 
                   department: str = None) -> int:
        """Create a new user"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (username, role, email, department)
            VALUES (?, ?, ?, ?)
        ''', (username, role, email, department))
        
        conn.commit()
        return cursor.lastrowid
    
    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE active = 1 ORDER BY username')
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def update_user(self, username: str, **kwargs) -> bool:
        """Update user information"""
        conn = self.connect()
        cursor = conn.cursor()
        
        valid_fields = ['role', 'email', 'department', 'active']
        updates = []
        values = []
        
        for field, value in kwargs.items():
            if field in valid_fields:
                updates.append(f"{field} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(username)
        query = f"UPDATE users SET {', '.join(updates)} WHERE username = ?"
        
        cursor.execute(query, values)
        conn.commit()
        
        return cursor.rowcount > 0
    
    def delete_user(self, username: str) -> bool:
        """Soft delete user"""
        return self.update_user(username, active=False)
    
    # ============ RESOURCE OPERATIONS ============
    
    def create_resource(self, name: str, type: str, path: str, 
                       description: str = None, owner: str = None) -> int:
        """Create a new resource"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO resources (name, type, path, description, owner)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, type, path, description, owner))
        
        conn.commit()
        return cursor.lastrowid
    
    def get_resource(self, name: str) -> Optional[Dict[str, Any]]:
        """Get resource by name"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM resources WHERE name = ?', (name,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    
    def get_all_resources(self) -> List[Dict[str, Any]]:
        """Get all resources"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM resources ORDER BY name')
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def update_resource(self, name: str, **kwargs) -> bool:
        """Update resource information"""
        conn = self.connect()
        cursor = conn.cursor()
        
        valid_fields = ['type', 'path', 'description', 'owner']
        updates = []
        values = []
        
        for field, value in kwargs.items():
            if field in valid_fields:
                updates.append(f"{field} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(name)
        query = f"UPDATE resources SET {', '.join(updates)} WHERE name = ?"
        
        cursor.execute(query, values)
        conn.commit()
        
        return cursor.rowcount > 0
    
    def delete_resource(self, name: str) -> bool:
        """Delete resource"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM resources WHERE name = ?', (name,))
        conn.commit()
        
        return cursor.rowcount > 0
    
    # ============ AUDIT LOG OPERATIONS ============
    
    def log_access(self, username: str, action: str, resource: str, 
                   allowed: bool, reason: str, ip_address: str = None) -> int:
        """Log an access attempt"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO audit_logs 
            (username, action, resource, allowed, reason, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, action, resource, allowed, reason, ip_address))
        
        conn.commit()
        return cursor.lastrowid
    
    def get_audit_logs(self, username: str = None, resource: str = None, 
                      limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit logs with optional filtering"""
        conn = self.connect()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM audit_logs WHERE 1=1'
        params = []
        
        if username:
            query += ' AND username = ?'
            params.append(username)
        
        if resource:
            query += ' AND resource = ?'
            params.append(resource)
        
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def get_access_statistics(self) -> Dict[str, Any]:
        """Get access statistics"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Total requests
        cursor.execute('SELECT COUNT(*) as total FROM audit_logs')
        total = cursor.fetchone()['total']
        
        # Allowed vs Denied
        cursor.execute('''
            SELECT 
                SUM(CASE WHEN allowed = 1 THEN 1 ELSE 0 END) as allowed,
                SUM(CASE WHEN allowed = 0 THEN 1 ELSE 0 END) as denied
            FROM audit_logs
        ''')
        access_counts = dict(cursor.fetchone())
        
        # Top users
        cursor.execute('''
            SELECT username, COUNT(*) as count
            FROM audit_logs
            GROUP BY username
            ORDER BY count DESC
            LIMIT 5
        ''')
        top_users = [dict(row) for row in cursor.fetchall()]
        
        # Top resources
        cursor.execute('''
            SELECT resource, COUNT(*) as count
            FROM audit_logs
            GROUP BY resource
            ORDER BY count DESC
            LIMIT 5
        ''')
        top_resources = [dict(row) for row in cursor.fetchall()]
        
        return {
            'total_requests': total,
            'allowed': access_counts['allowed'] or 0,
            'denied': access_counts['denied'] or 0,
            'top_users': top_users,
            'top_resources': top_resources
        }
    
    # ============ POLICY OPERATIONS ============
    
    def save_compiled_policy(self, name: str, source_code: str, 
                            compiled_json: str, created_by: str = None) -> int:
        """Save a compiled policy"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Deactivate previous versions
        cursor.execute('''
            UPDATE compiled_policies 
            SET active = 0 
            WHERE name = ?
        ''', (name,))
        
        # Insert new version
        cursor.execute('''
            SELECT COALESCE(MAX(version), 0) + 1 as next_version
            FROM compiled_policies
            WHERE name = ?
        ''', (name,))
        next_version = cursor.fetchone()['next_version']
        
        cursor.execute('''
            INSERT INTO compiled_policies 
            (name, source_code, compiled_json, version, created_by)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, source_code, compiled_json, next_version, created_by))
        
        conn.commit()
        return cursor.lastrowid
    
    def get_active_policy(self, name: str = None) -> Optional[Dict[str, Any]]:
        """Get active policy"""
        conn = self.connect()
        cursor = conn.cursor()
        
        if name:
            cursor.execute('''
                SELECT * FROM compiled_policies 
                WHERE name = ? AND active = 1
                ORDER BY version DESC
                LIMIT 1
            ''', (name,))
        else:
            cursor.execute('''
                SELECT * FROM compiled_policies 
                WHERE active = 1
                ORDER BY created_at DESC
                LIMIT 1
            ''')
        
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    
    def get_policy_history(self, name: str) -> List[Dict[str, Any]]:
        """Get version history of a policy"""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM compiled_policies
            WHERE name = ?
            ORDER BY version DESC
        ''', (name,))
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    
    # ============ INITIALIZATION ============
    
    def initialize_sample_data(self):
        """Initialize database with sample data"""
        # Create sample users
        try:
            self.create_user('Alice', 'Admin', 'alice@utech.edu.jm', 'IT')
        except:
            pass
        
        try:
            self.create_user('Bob', 'Developer', 'bob@utech.edu.jm', 'Engineering')
        except:
            pass
        
        try:
            self.create_user('Charlie', 'Guest', 'charlie@utech.edu.jm', 'Sales')
        except:
            pass
        
        # Create sample resources
        try:
            self.create_resource('DB_Finance', 'database', '/data/financial', 
                               'Financial database', 'Alice')
        except:
            pass
        
        try:
            self.create_resource('DB_HR', 'database', '/data/hr', 
                               'HR database', 'Alice')
        except:
            pass
        
        try:
            self.create_resource('API_Users', 'api', '/api/users', 
                               'User management API', 'Bob')
        except:
            pass