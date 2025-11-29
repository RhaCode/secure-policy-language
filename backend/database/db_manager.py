"""
backend/database/db_manager.py
Simplified SQLite Database Manager for User/Resource Management
Uses standard SQLite configuration without WAL or complex concurrency handling
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import os
from contextlib import contextmanager


class DatabaseManager:
    """Manages SQLite database for users, resources, and audit logs"""
    
    def __init__(self, db_path: str = "spl_database.db"):
        """Initialize database connection"""
        self.db_path = db_path
        self.create_tables()
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for database connections
        Creates a fresh connection for each operation
        """
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def create_tables(self):
        """Create all necessary tables"""
        with self.get_connection() as conn:
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
    
    # ============ USER OPERATIONS ============
    
    def create_user(self, username: str, role: str, email: str = None, 
                   department: str = None) -> int:
        """Create a new user"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (username, role, email, department)
                VALUES (?, ?, ?, ?)
            ''', (username, role, email, department))
            return cursor.lastrowid
    
    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE active = 1 ORDER BY username')
            return [dict(row) for row in cursor.fetchall()]
    
    def update_user(self, username: str, **kwargs) -> bool:
        """Update user information"""
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
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, values)
            return cursor.rowcount > 0
    
    def delete_user(self, username: str) -> bool:
        """Soft delete user"""
        return self.update_user(username, active=False)
    
    # ============ RESOURCE OPERATIONS ============
    
    def create_resource(self, name: str, type: str, path: str, 
                       description: str = None, owner: str = None) -> int:
        """Create a new resource"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO resources (name, type, path, description, owner)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, type, path, description, owner))
            return cursor.lastrowid
    
    def get_resource(self, name: str) -> Optional[Dict[str, Any]]:
        """Get resource by name"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM resources WHERE name = ?', (name,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_all_resources(self) -> List[Dict[str, Any]]:
        """Get all resources"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM resources ORDER BY name')
            return [dict(row) for row in cursor.fetchall()]
    
    def update_resource(self, name: str, **kwargs) -> bool:
        """Update resource information"""
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
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, values)
            return cursor.rowcount > 0
    
    def delete_resource(self, name: str) -> bool:
        """Delete resource"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM resources WHERE name = ?', (name,))
            return cursor.rowcount > 0
    
    # ============ AUDIT LOG OPERATIONS ============
    
    def log_access(self, username: str, action: str, resource: str, 
                   allowed: bool, reason: str, ip_address: str = None) -> int:
        """Log an access attempt"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO audit_logs 
                (username, action, resource, allowed, reason, ip_address)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (username, action, resource, allowed, reason, ip_address))
            return cursor.lastrowid
    
    def get_audit_logs(self, username: str = None, resource: str = None, 
                      limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit logs with optional filtering"""
        with self.get_connection() as conn:
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
            return [dict(row) for row in cursor.fetchall()]
    
    def get_access_statistics(self) -> Dict[str, Any]:
        """Get access statistics"""
        with self.get_connection() as conn:
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
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Deactivate previous versions
            cursor.execute('''
                UPDATE compiled_policies 
                SET active = 0 
                WHERE name = ?
            ''', (name,))
            
            # Get next version number
            cursor.execute('''
                SELECT COALESCE(MAX(version), 0) + 1 as next_version
                FROM compiled_policies
                WHERE name = ?
            ''', (name,))
            next_version = cursor.fetchone()['next_version']
            
            # Insert new version
            cursor.execute('''
                INSERT INTO compiled_policies 
                (name, source_code, compiled_json, version, created_by)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, source_code, compiled_json, next_version, created_by))
            
            return cursor.lastrowid
    
    def get_active_policy(self, name: str = None) -> Optional[Dict[str, Any]]:
        """Get active policy"""
        with self.get_connection() as conn:
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
            return dict(row) if row else None
    
    def get_policy_history(self, name: str) -> List[Dict[str, Any]]:
        """Get version history of a policy"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM compiled_policies
                WHERE name = ?
                ORDER BY version DESC
            ''', (name,))
            return [dict(row) for row in cursor.fetchall()]
    
    # ============ INITIALIZATION ============
    
    def initialize_sample_data(self):
        """Initialize database with sample data"""
        # Create sample users
        users_to_create = [
            ('Alice', 'Admin', 'alice@utech.edu.jm', 'IT'),
            ('Bob', 'Developer', 'bob@utech.edu.jm', 'Engineering'),
            ('Charlie', 'Guest', 'charlie@utech.edu.jm', 'Sales')
        ]
        
        for username, role, email, dept in users_to_create:
            try:
                self.create_user(username, role, email, dept)
            except sqlite3.IntegrityError:
                # User already exists, skip
                pass
        
        # Create sample resources
        resources_to_create = [
            ('DB_Finance', 'database', '/data/financial', 'Financial database', 'Alice'),
            ('DB_HR', 'database', '/data/hr', 'HR database', 'Alice'),
            ('API_Users', 'api', '/api/users', 'User management API', 'Bob')
        ]
        
        for name, rtype, path, desc, owner in resources_to_create:
            try:
                self.create_resource(name, rtype, path, desc, owner)
            except sqlite3.IntegrityError:
                # Resource already exists, skip
                pass