"""
backend/api/execution_routes.py
API Routes for Policy Execution and Management
"""

from flask import Blueprint, request, jsonify
from database.db_manager import DatabaseManager
from execution.policy_engine import PolicyEngine
import json

# Create Blueprint
execution_api = Blueprint('execution', __name__)

# Initialize database
db = DatabaseManager()
db.initialize_sample_data()

# Store current policy engine (in production, use Redis or similar)
_current_engine = None


def get_policy_engine():
    """Get current policy engine instance"""
    global _current_engine
    
    if _current_engine is None:
        # Load active policy from database
        policy_data = db.get_active_policy()
        if policy_data:
            compiled_json = json.loads(policy_data['compiled_json'])
            _current_engine = PolicyEngine(compiled_json)
    
    return _current_engine


def set_policy_engine(compiled_policy: dict):
    """Set new policy engine"""
    global _current_engine
    _current_engine = PolicyEngine(compiled_policy)


# ============ POLICY EXECUTION ============

@execution_api.route('/check-access', methods=['POST'])
def check_access():
    """
    Check if user has access to perform action on resource
    
    Request body:
    {
        "username": "Alice",
        "action": "read",
        "resource": "DB_Finance",
        "context": {
            "hour": 14,
            "ip_address": "192.168.1.1"
        }
    }
    """
    try:
        data = request.get_json()
        
        username = data.get('username')
        action = data.get('action')
        resource = data.get('resource')
        context = data.get('context', {})
        
        if not all([username, action, resource]):
            return jsonify({
                'error': 'Missing required fields: username, action, resource'
            }), 400
        
        engine = get_policy_engine()
        if not engine:
            return jsonify({
                'error': 'No active policy loaded'
            }), 500
        
        # Check access
        result = engine.check_access(username, action, resource, context)
        
        # Log to audit
        ip_address = context.get('ip_address', request.remote_addr)
        db.log_access(
            username=username,
            action=action,
            resource=resource,
            allowed=result['allowed'],
            reason=result['reason'],
            ip_address=ip_address
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/activate-policy', methods=['POST'])
def activate_policy():
    """
    Activate a compiled policy
    
    Request body:
    {
        "name": "production_policy",
        "source_code": "...",
        "compiled_json": {...}
    }
    """
    try:
        data = request.get_json()
        
        name = data.get('name', 'default_policy')
        source_code = data.get('source_code')
        compiled_json = data.get('compiled_json')
        created_by = data.get('created_by', 'system')
        
        if not compiled_json:
            return jsonify({
                'error': 'Missing compiled_json'
            }), 400
        
        # Save to database
        policy_id = db.save_compiled_policy(
            name=name,
            source_code=source_code or '',
            compiled_json=json.dumps(compiled_json),
            created_by=created_by
        )
        
        # Activate in engine
        set_policy_engine(compiled_json)
        
        return jsonify({
            'success': True,
            'policy_id': policy_id,
            'message': f'Policy "{name}" activated successfully'
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/user-permissions/<username>', methods=['GET'])
def get_user_permissions(username):
    """Get all permissions for a user"""
    try:
        engine = get_policy_engine()
        if not engine:
            return jsonify({
                'error': 'No active policy loaded'
            }), 500
        
        permissions = engine.get_user_permissions(username)
        
        return jsonify(permissions)
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# ============ USER MANAGEMENT ============

@execution_api.route('/users', methods=['GET', 'POST'])
def manage_users():
    """Get all users or create new user"""
    try:
        if request.method == 'GET':
            users = db.get_all_users()
            return jsonify({
                'success': True,
                'users': users
            })
        
        else:  # POST
            data = request.get_json()
            
            username = data.get('username')
            role = data.get('role')
            email = data.get('email')
            department = data.get('department')
            
            if not all([username, role]):
                return jsonify({
                    'error': 'Missing required fields: username, role'
                }), 400
            
            user_id = db.create_user(username, role, email, department)
            
            return jsonify({
                'success': True,
                'user_id': user_id,
                'message': f'User "{username}" created successfully'
            }), 201
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/users/<username>', methods=['GET', 'PUT', 'DELETE'])
def manage_user(username):
    """Get, update, or delete specific user"""
    try:
        if request.method == 'GET':
            user = db.get_user(username)
            if not user:
                return jsonify({
                    'error': f'User "{username}" not found'
                }), 404
            
            return jsonify({
                'success': True,
                'user': user
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            success = db.update_user(username, **data)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'User "{username}" updated successfully'
                })
            else:
                return jsonify({
                    'error': f'Failed to update user "{username}"'
                }), 500
        
        else:  # DELETE
            success = db.delete_user(username)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'User "{username}" deleted successfully'
                })
            else:
                return jsonify({
                    'error': f'Failed to delete user "{username}"'
                }), 500
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# ============ RESOURCE MANAGEMENT ============

@execution_api.route('/resources', methods=['GET', 'POST'])
def manage_resources():
    """Get all resources or create new resource"""
    try:
        if request.method == 'GET':
            resources = db.get_all_resources()
            return jsonify({
                'success': True,
                'resources': resources
            })
        
        else:  # POST
            data = request.get_json()
            
            name = data.get('name')
            type = data.get('type')
            path = data.get('path')
            description = data.get('description')
            owner = data.get('owner')
            
            if not all([name, type, path]):
                return jsonify({
                    'error': 'Missing required fields: name, type, path'
                }), 400
            
            resource_id = db.create_resource(name, type, path, description, owner)
            
            return jsonify({
                'success': True,
                'resource_id': resource_id,
                'message': f'Resource "{name}" created successfully'
            }), 201
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/resources/<name>', methods=['GET', 'PUT', 'DELETE'])
def manage_resource(name):
    """Get, update, or delete specific resource"""
    try:
        if request.method == 'GET':
            resource = db.get_resource(name)
            if not resource:
                return jsonify({
                    'error': f'Resource "{name}" not found'
                }), 404
            
            return jsonify({
                'success': True,
                'resource': resource
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            success = db.update_resource(name, **data)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'Resource "{name}" updated successfully'
                })
            else:
                return jsonify({
                    'error': f'Failed to update resource "{name}"'
                }), 500
        
        else:  # DELETE
            success = db.delete_resource(name)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'Resource "{name}" deleted successfully'
                })
            else:
                return jsonify({
                    'error': f'Failed to delete resource "{name}"'
                }), 500
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# ============ AUDIT LOGS ============

@execution_api.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs with optional filtering"""
    try:
        username = request.args.get('username')
        resource = request.args.get('resource')
        limit = int(request.args.get('limit', 100))
        
        logs = db.get_audit_logs(username, resource, limit)
        
        return jsonify({
            'success': True,
            'logs': logs,
            'count': len(logs)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/statistics', methods=['GET'])
def get_statistics():
    """Get access statistics"""
    try:
        stats = db.get_access_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# ============ POLICY HISTORY ============

@execution_api.route('/policies', methods=['GET'])
def get_policies():
    """Get all policies"""
    try:
        # This would return all policy names/versions
        # For now, return active policy
        policy = db.get_active_policy()
        
        if policy:
            return jsonify({
                'success': True,
                'active_policy': {
                    'name': policy['name'],
                    'version': policy['version'],
                    'created_at': policy['created_at']
                }
            })
        else:
            return jsonify({
                'success': True,
                'active_policy': None
            })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/policies/<name>/history', methods=['GET'])
def get_policy_history(name):
    """Get version history of a policy"""
    try:
        history = db.get_policy_history(name)
        
        return jsonify({
            'success': True,
            'policy_name': name,
            'versions': history
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500