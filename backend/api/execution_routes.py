"""
backend/api/execution_routes.py
READ-ONLY API Routes for Policy Execution and Data Retrieval
No CRUD operations - data comes from compiled SPL source code only
"""

from flask import Blueprint, request, jsonify
import json

# Create Blueprint with correct URL prefix
execution_api = Blueprint('execution', __name__, url_prefix='/api/execution')

# Lazy initialization
_db = None
_current_engine = None


def get_db():
    """Lazy load database manager"""
    global _db
    if _db is None:
        try:
            from database.db_manager import DatabaseManager
            _db = DatabaseManager()
        except Exception as e:
            print(f"Error initializing database: {e}")
            return None
    return _db


def get_policy_engine():
    """Get current policy engine instance"""
    global _current_engine
    
    if _current_engine is None:
        # Try to load active policy from database
        db = get_db()
        if db:
            try:
                policy_data = db.get_active_policy()
                if policy_data:
                    from execution.policy_engine import PolicyEngine
                    compiled_json = json.loads(policy_data['compiled_json'])
                    _current_engine = PolicyEngine(compiled_json)
                    print(f"✓ Loaded active policy: {policy_data['name']} v{policy_data['version']}")
            except Exception as e:
                print(f"Error loading policy engine: {e}")
    
    return _current_engine


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
                'error': 'No active policy loaded. Please compile and activate a policy first.'
            }), 500
        
        # Check access
        result = engine.check_access(username, action, resource, context)
        
        # Log to audit
        db = get_db()
        if db:
            ip_address = context.get('ip_address', request.remote_addr)
            try:
                db.log_access(
                    username=username,
                    action=action,
                    resource=resource,
                    allowed=result['allowed'],
                    reason=result['reason'],
                    ip_address=ip_address
                )
            except Exception as e:
                print(f"Warning: Failed to log access: {e}")
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/user-permissions/<username>', methods=['GET'])
def get_user_permissions(username):
    """
    Get all permissions for a specific user
    """
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


# ============ READ-ONLY DATA ENDPOINTS FOR FRONTEND ============

@execution_api.route('/users', methods=['GET'])
def get_users():
    """
    Get all users defined in the compiled policy
    READ ONLY - users are defined in SPL source code
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        users = db.get_all_users()
        
        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/users/<username>', methods=['GET'])
def get_user(username):
    """
    Get specific user information
    READ ONLY
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        user = db.get_user(username)
        if not user:
            return jsonify({
                'error': f'User "{username}" not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/resources', methods=['GET'])
def get_resources():
    """
    Get all resources defined in the compiled policy
    READ ONLY - resources are defined in SPL source code
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        resources = db.get_all_resources()
        
        return jsonify({
            'success': True,
            'resources': resources,
            'count': len(resources)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/resources/<name>', methods=['GET'])
def get_resource(name):
    """
    Get specific resource information
    READ ONLY
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        resource = db.get_resource(name)
        if not resource:
            return jsonify({
                'error': f'Resource "{name}" not found'
            }), 404
        
        return jsonify({
            'success': True,
            'resource': resource
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/policies', methods=['GET'])
def get_policies():
    """
    Get active policy information
    READ ONLY - policy is defined in SPL source code
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        policy = db.get_active_policy()
        
        if policy:
            # Return as array with single active policy
            return jsonify([{
                'id': policy['id'],
                'name': policy['name'],
                'version': policy['version'],
                'created_at': policy['created_at'],
                'active': True,
                'created_by': policy.get('created_by', 'system')
            }])
        else:
            # Return empty array if no active policy
            return jsonify([])
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/policies/<int:policy_id>', methods=['GET'])
def get_policy_details(policy_id):
    """
    Get detailed information about a specific policy version
    READ ONLY
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM compiled_policies WHERE id = ?', (policy_id,))
            policy = cursor.fetchone()
            
            if not policy:
                return jsonify({
                    'error': f'Policy with ID {policy_id} not found'
                }), 404
            
            policy_dict = dict(policy)
            # Parse compiled_json
            try:
                policy_dict['compiled_json'] = json.loads(policy_dict['compiled_json'])
            except:
                pass
            
            return jsonify({
                'success': True,
                'policy': policy_dict
            })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/policies/<name>/history', methods=['GET'])
def get_policy_history(name):
    """
    Get version history of a policy
    READ ONLY
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        history = db.get_policy_history(name)
        
        return jsonify({
            'success': True,
            'policy_name': name,
            'versions': history,
            'total_versions': len(history)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@execution_api.route('/policies/source', methods=['GET'])
def get_active_policy_source():
    """
    Get source code for the currently active policy
    READ ONLY
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        policy = db.get_active_policy()
        
        if not policy:
            return jsonify({
                'error': 'No active policy found',
                'success': False
            }), 404
        
        return jsonify({
            'success': True,
            'source_code': policy['source_code'],
            'policy_name': policy['name'],
            'policy_version': policy['version'],
            'created_at': policy['created_at'],
            'created_by': policy.get('created_by', 'system')
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


# ============ AUDIT LOGS ============

@execution_api.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    """
    Get audit logs with optional filtering
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
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
    """
    Get access statistics and system information
    """
    try:
        db = get_db()
        if not db:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        # Get database statistics
        stats = db.get_access_statistics()
        
        # Get counts
        users = db.get_all_users()
        resources = db.get_all_resources()
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) as total FROM compiled_policies')
            total_policies = cursor.fetchone()['total']
        
        return jsonify({
            'success': True,
            'statistics': {
                'users': {
                    'total': len(users),
                    'active': sum(1 for u in users if u.get('active', 1))
                },
                'resources': {
                    'total': len(resources)
                },
                'policies': {
                    'total': total_policies
                },
                'access_logs': {
                    'total_requests': stats.get('total_requests', 0),
                    'allowed': stats.get('allowed', 0),
                    'denied': stats.get('denied', 0),
                    'top_users': stats.get('top_users', []),
                    'top_resources': stats.get('top_resources', [])
                }
            }
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# ============ HEALTH CHECK ============

@execution_api.route('/health', methods=['GET'])
def execution_health_check():
    """Health check for execution engine"""
    db = get_db()
    engine = get_policy_engine()
    
    return jsonify({
        'status': 'healthy',
        'database': 'available' if db else 'unavailable',
        'policy_engine': 'active' if engine else 'inactive'
    })