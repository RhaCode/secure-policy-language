"""
backend/api/crud_routes.py
CRUD Routes for Users, Resources, and Policies Management
Complete implementation with validation and error handling
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json

# Create Blueprint
crud_api = Blueprint('crud', __name__, url_prefix='/api/crud')

# Database connection
_db = None


def get_db():
    """Get database manager instance"""
    global _db
    if _db is None:
        try:
            from database.db_manager import DatabaseManager
            _db = DatabaseManager()
        except Exception as e:
            print(f"Error initializing database: {e}")
            return None
    return _db


# ============ ERROR RESPONSE HELPERS ============

def error_response(message, status_code=400):
    """Standard error response format"""
    return jsonify({"success": False, "error": message}), status_code


def success_response(data, message="", status_code=200):
    """Standard success response format"""
    response = {
        "success": True,
        "data": data,
    }
    if message:
        response["message"] = message
    return jsonify(response), status_code


# ============ USERS CRUD ============

@crud_api.route('/users', methods=['GET'])
def list_users():
    """
    GET /api/crud/users
    Returns all active users
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        users = db.get_all_users()
        return success_response(users)
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/users', methods=['POST'])
def create_user():
    """
    POST /api/crud/users
    Create a new user
    
    Request body:
    {
        "username": "alice",
        "role": "Admin",
        "email": "alice@company.com",
        "department": "IT"
    }
    """
    try:
        data = request.get_json()
        
        # Validation
        if not data:
            return error_response("Request body is empty", 400)
        
        username = data.get('username', '').strip()
        role = data.get('role', '').strip()
        email = data.get('email', '').strip() or None
        department = data.get('department', '').strip() or None
        
        # Required fields
        if not username:
            return error_response("Username is required", 400)
        if not role:
            return error_response("Role is required", 400)
        
        # Validation
        if len(username) < 3:
            return error_response("Username must be at least 3 characters", 400)
        if len(username) > 50:
            return error_response("Username must not exceed 50 characters", 400)
        if not username.replace('_', '').replace('-', '').isalnum():
            return error_response("Username can only contain alphanumeric characters, hyphens, and underscores", 400)
        
        if len(role) < 2:
            return error_response("Role must be at least 2 characters", 400)
        
        if email and '@' not in email:
            return error_response("Invalid email format", 400)
        
        # Check if user already exists
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        existing_user = db.get_user(username)
        if existing_user:
            return error_response(f"User '{username}' already exists", 409)
        
        # Create user
        user_id = db.create_user(username, role, email, department)
        
        return success_response(
            {
                "user_id": user_id,
                "username": username,
                "role": role,
                "email": email,
                "department": department
            },
            f"User '{username}' created successfully",
            201
        )
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/users/<username>', methods=['GET'])
def get_user(username):
    """
    GET /api/crud/users/<username>
    Get a specific user by username
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        user = db.get_user(username)
        if not user:
            return error_response(f"User '{username}' not found", 404)
        
        return success_response(user)
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/users/<username>', methods=['PUT'])
def update_user(username):
    """
    PUT /api/crud/users/<username>
    Update a user's information
    
    Request body:
    {
        "role": "Developer",
        "email": "alice@newcompany.com",
        "department": "Engineering"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is empty", 400)
        
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        # Check if user exists
        user = db.get_user(username)
        if not user:
            return error_response(f"User '{username}' not found", 404)
        
        # Prepare update fields
        update_fields = {}
        
        if 'role' in data:
            role = data['role'].strip()
            if not role:
                return error_response("Role cannot be empty", 400)
            if len(role) < 2:
                return error_response("Role must be at least 2 characters", 400)
            update_fields['role'] = role
        
        if 'email' in data:
            email = data['email'].strip()
            if email and '@' not in email:
                return error_response("Invalid email format", 400)
            update_fields['email'] = email or None
        
        if 'department' in data:
            department = data['department'].strip()
            update_fields['department'] = department or None
        
        if 'active' in data:
            update_fields['active'] = bool(data['active'])
        
        if not update_fields:
            return error_response("No fields to update", 400)
        
        # Update user
        success = db.update_user(username, **update_fields)
        
        if not success:
            return error_response("Failed to update user", 500)
        
        # Get updated user
        updated_user = db.get_user(username)
        return success_response(updated_user, f"User '{username}' updated successfully")
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/users/<username>', methods=['DELETE'])
def delete_user(username):
    """
    DELETE /api/crud/users/<username>
    Soft delete a user (marks as inactive)
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        # Check if user exists
        user = db.get_user(username)
        if not user:
            return error_response(f"User '{username}' not found", 404)
        
        # Soft delete
        success = db.delete_user(username)
        
        if not success:
            return error_response("Failed to delete user", 500)
        
        return success_response(
            {"username": username},
            f"User '{username}' deleted successfully"
        )
    
    except Exception as e:
        return error_response(str(e), 500)


# ============ RESOURCES CRUD ============

@crud_api.route('/resources', methods=['GET'])
def list_resources():
    """
    GET /api/crud/resources
    Returns all resources
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        resources = db.get_all_resources()
        return success_response(resources)
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/resources', methods=['POST'])
def create_resource():
    """
    POST /api/crud/resources
    Create a new resource
    
    Request body:
    {
        "name": "DB_Finance",
        "type": "database",
        "path": "/data/financial",
        "description": "Financial database",
        "owner": "alice"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is empty", 400)
        
        # Validation
        name = data.get('name', '').strip()
        resource_type = data.get('type', '').strip()
        path = data.get('path', '').strip()
        description = data.get('description', '').strip() or None
        owner = data.get('owner', '').strip() or None
        
        # Required fields
        if not name:
            return error_response("Resource name is required", 400)
        if not resource_type:
            return error_response("Resource type is required", 400)
        if not path:
            return error_response("Resource path is required", 400)
        
        # Validation
        if len(name) < 3:
            return error_response("Resource name must be at least 3 characters", 400)
        if len(name) > 100:
            return error_response("Resource name must not exceed 100 characters", 400)
        
        if len(path) < 2:
            return error_response("Path must be at least 2 characters", 400)
        
        # Valid resource types
        valid_types = ['database', 'api', 'file', 'service', 'other']
        if resource_type.lower() not in valid_types:
            return error_response(f"Invalid type. Must be one of: {', '.join(valid_types)}", 400)
        
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        # Check if resource already exists
        existing_resource = db.get_resource(name)
        if existing_resource:
            return error_response(f"Resource '{name}' already exists", 409)
        
        # If owner specified, verify it exists
        if owner:
            owner_user = db.get_user(owner)
            if not owner_user:
                return error_response(f"Owner user '{owner}' not found", 404)
        
        # Create resource
        resource_id = db.create_resource(name, resource_type, path, description, owner)
        
        return success_response(
            {
                "resource_id": resource_id,
                "name": name,
                "type": resource_type,
                "path": path,
                "description": description,
                "owner": owner
            },
            f"Resource '{name}' created successfully",
            201
        )
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/resources/<name>', methods=['GET'])
def get_resource(name):
    """
    GET /api/crud/resources/<name>
    Get a specific resource by name
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        resource = db.get_resource(name)
        if not resource:
            return error_response(f"Resource '{name}' not found", 404)
        
        return success_response(resource)
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/resources/<name>', methods=['PUT'])
def update_resource(name):
    """
    PUT /api/crud/resources/<name>
    Update a resource's information
    
    Request body:
    {
        "type": "database",
        "path": "/data/financial_v2",
        "description": "Updated description",
        "owner": "bob"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is empty", 400)
        
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        # Check if resource exists
        resource = db.get_resource(name)
        if not resource:
            return error_response(f"Resource '{name}' not found", 404)
        
        # Prepare update fields
        update_fields = {}
        
        if 'type' in data:
            resource_type = data['type'].strip()
            valid_types = ['database', 'api', 'file', 'service', 'other']
            if resource_type.lower() not in valid_types:
                return error_response(f"Invalid type. Must be one of: {', '.join(valid_types)}", 400)
            update_fields['type'] = resource_type
        
        if 'path' in data:
            path = data['path'].strip()
            if not path:
                return error_response("Path cannot be empty", 400)
            update_fields['path'] = path
        
        if 'description' in data:
            description = data['description'].strip()
            update_fields['description'] = description or None
        
        if 'owner' in data:
            owner = data['owner'].strip()
            if owner:
                owner_user = db.get_user(owner)
                if not owner_user:
                    return error_response(f"Owner user '{owner}' not found", 404)
            update_fields['owner'] = owner or None
        
        if not update_fields:
            return error_response("No fields to update", 400)
        
        # Update resource
        success = db.update_resource(name, **update_fields)
        
        if not success:
            return error_response("Failed to update resource", 500)
        
        # Get updated resource
        updated_resource = db.get_resource(name)
        return success_response(updated_resource, f"Resource '{name}' updated successfully")
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/resources/<name>', methods=['DELETE'])
def delete_resource(name):
    """
    DELETE /api/crud/resources/<name>
    Delete a resource
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        # Check if resource exists
        resource = db.get_resource(name)
        if not resource:
            return error_response(f"Resource '{name}' not found", 404)
        
        # Delete resource
        success = db.delete_resource(name)
        
        if not success:
            return error_response("Failed to delete resource", 500)
        
        return success_response(
            {"name": name},
            f"Resource '{name}' deleted successfully"
        )
    
    except Exception as e:
        return error_response(str(e), 500)


# ============ POLICIES CRUD ============

@crud_api.route('/policies', methods=['GET'])
def list_policies():
    """
    GET /api/crud/policies
    Returns all compiled policies with version info
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        # Get active policy
        active = db.get_active_policy()
        
        return success_response({
            "active_policy": active,
            "status": "active" if active else "no_policy_loaded"
        })
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/policies/history/<name>', methods=['GET'])
def get_policy_history(name):
    """
    GET /api/crud/policies/history/<name>
    Get version history of a policy
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        history = db.get_policy_history(name)
        
        if not history:
            return error_response(f"No policies found with name '{name}'", 404)
        
        return success_response({
            "policy_name": name,
            "versions": history,
            "total_versions": len(history)
        })
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/policies/<int:policy_id>', methods=['GET'])
def get_policy(policy_id):
    """
    GET /api/crud/policies/<policy_id>
    Get a specific policy by ID
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM compiled_policies WHERE id = ?', (policy_id,))
            policy = cursor.fetchone()
            
            if not policy:
                return error_response(f"Policy with ID {policy_id} not found", 404)
            
            policy_dict = dict(policy)
            # Parse compiled_json
            try:
                policy_dict['compiled_json'] = json.loads(policy_dict['compiled_json'])
            except:
                pass
            
            return success_response(policy_dict)
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/policies/<int:policy_id>', methods=['DELETE'])
def delete_policy(policy_id):
    """
    DELETE /api/crud/policies/<policy_id>
    Delete a specific policy version (deactivate if active)
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if policy exists
            cursor.execute('SELECT * FROM compiled_policies WHERE id = ?', (policy_id,))
            policy = cursor.fetchone()
            
            if not policy:
                return error_response(f"Policy with ID {policy_id} not found", 404)
            
            # Deactivate if active
            cursor.execute(
                'UPDATE compiled_policies SET active = 0 WHERE id = ?',
                (policy_id,)
            )
            conn.commit()
            
            return success_response(
                {"policy_id": policy_id},
                "Policy deactivated successfully"
            )
    
    except Exception as e:
        return error_response(str(e), 500)


@crud_api.route('/policies/<int:policy_id>/activate', methods=['POST'])
def activate_policy(policy_id):
    """
    POST /api/crud/policies/<policy_id>/activate
    Activate a specific policy version
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if policy exists
            cursor.execute('SELECT * FROM compiled_policies WHERE id = ?', (policy_id,))
            policy = cursor.fetchone()
            
            if not policy:
                return error_response(f"Policy with ID {policy_id} not found", 404)
            
            policy_name = policy['name']
            
            # Deactivate all versions of this policy
            cursor.execute(
                'UPDATE compiled_policies SET active = 0 WHERE name = ?',
                (policy_name,)
            )
            
            # Activate this version
            cursor.execute(
                'UPDATE compiled_policies SET active = 1 WHERE id = ?',
                (policy_id,)
            )
            conn.commit()
            
            # Load into execution engine
            compiled_json = json.loads(policy['compiled_json'])
            from api.execution_routes import set_policy_engine
            success = set_policy_engine(compiled_json)
            
            if not success:
                return error_response("Failed to load policy into execution engine", 500)
            
            return success_response(
                {"policy_id": policy_id, "policy_name": policy_name},
                f"Policy '{policy_name}' v{policy['version']} activated successfully"
            )
    
    except Exception as e:
        return error_response(str(e), 500)


# ============ STATISTICS & MONITORING ============

@crud_api.route('/statistics', methods=['GET'])
def get_statistics():
    """
    GET /api/crud/statistics
    Get overall statistics about users, resources, and policies
    """
    try:
        db = get_db()
        if not db:
            return error_response("Database not available", 500)
        
        users = db.get_all_users()
        resources = db.get_all_resources()
        stats = db.get_access_statistics()
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) as total FROM compiled_policies')
            total_policies = cursor.fetchone()['total']
        
        return success_response({
            "users": {
                "total": len(users),
                "active": sum(1 for u in users if u.get('active', 1))
            },
            "resources": {
                "total": len(resources)
            },
            "policies": {
                "total": total_policies
            },
            "access_logs": {
                "total_requests": stats.get('total_requests', 0),
                "allowed": stats.get('allowed', 0),
                "denied": stats.get('denied', 0),
                "top_users": stats.get('top_users', []),
                "top_resources": stats.get('top_resources', [])
            }
        })
    
    except Exception as e:
        return error_response(str(e), 500)


# ============ HEALTH CHECK ============

@crud_api.route('/health', methods=['GET'])
def health():
    """
    GET /api/crud/health
    Health check endpoint
    """
    db = get_db()
    return success_response({
        "status": "healthy",
        "database": "available" if db else "unavailable",
        "timestamp": datetime.now().isoformat()
    })