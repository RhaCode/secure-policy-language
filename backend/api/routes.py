"""
backend/api/routes.py
UNIFIED API Routes for SPL Compiler & Execution Engine
SOURCE CODE AS SINGLE SOURCE OF TRUTH
All data comes from compiled SPL code - no manual CRUD operations
"""

from flask import Blueprint, request, jsonify
from compiler.semantic_analyzer import SemanticAnalyzer
from compiler.lexer import SPLLexer
from compiler.parser import SPLParser
from compiler.ast_nodes import ASTPrinter, ASTVisitor
import json

# Import database and execution engine
try:
    from database.db_manager import DatabaseManager
    from execution.policy_engine import PolicyEngine
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("Warning: Database not available. Policies will not be persisted.")

# Create single Blueprint for all routes
api = Blueprint('api', __name__, url_prefix='/api')

# Initialize compiler components
lexer = SPLLexer()
parser = SPLParser()

# Initialize database if available
if DB_AVAILABLE:
    db = DatabaseManager()
    _current_engine = None
else:
    db = None
    _current_engine = None


class SPLDataExtractor(ASTVisitor):
    """Extract users, resources, and policies from AST for database population"""
    def __init__(self):
        self.users = []
        self.resources = []
        self.roles = {}
    
    def visit_RoleNode(self, node):
        """Extract role information"""
        self.roles[node.name] = node.properties
    
    def visit_UserNode(self, node):
        """Extract user information"""
        user_data = {
            'username': node.name,
            'role': node.properties.get('role', 'Guest'),
            'email': node.properties.get('email'),
            'department': node.properties.get('department')
        }
        self.users.append(user_data)
    
    def visit_ResourceNode(self, node):
        """Extract resource information"""
        resource_data = {
            'name': node.name,
            'type': node.properties.get('type', 'other'),
            'path': node.properties.get('path', '/'),
            'description': node.properties.get('description'),
            'owner': node.properties.get('owner')
        }
        self.resources.append(resource_data)
    
    def visit_PolicyNode(self, node):
        pass
    
    def visit_BinaryOpNode(self, node):
        pass
    
    def visit_UnaryOpNode(self, node):
        pass
    
    def visit_AttributeNode(self, node):
        pass
    
    def visit_LiteralNode(self, node):
        pass


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_db():
    """Get database manager instance"""
    global db
    if db is None and DB_AVAILABLE:
        db = DatabaseManager()
    return db


def get_policy_engine():
    """Get current policy engine instance"""
    global _current_engine
    
    if _current_engine is None:
        database = get_db()
        if database:
            try:
                policy_data = database.get_active_policy()
                if policy_data:
                    compiled_json = json.loads(policy_data['compiled_json'])
                    _current_engine = PolicyEngine(compiled_json)
                    
                    print(f"✓ Loaded active policy: {policy_data['name']} v{policy_data['version']}")
                    print(f"  - Policies: {len(compiled_json.get('policies', []))}")
                    for policy in compiled_json.get('policies', []):
                        print(f"    - {policy['type']}: {policy['actions']} on {policy['resource']}")
                        if policy.get('condition'):
                            print(f"      Condition: {policy['condition']}")
                            
            except Exception as e:
                print(f"Error loading policy engine: {e}")
                import traceback
                traceback.print_exc()
    
    return _current_engine


def force_reload_engine():
    """Force reload of policy engine from database after compilation"""
    global _current_engine
    
    print("\n🔄 Force reloading policy engine...")
    _current_engine = None
    
    database = get_db()
    if database:
        try:
            policy_data = database.get_active_policy()
            if policy_data:
                compiled_json = json.loads(policy_data['compiled_json'])
                _current_engine = PolicyEngine(compiled_json)
                
                print(f"✓ Reloaded policy: {policy_data['name']} v{policy_data['version']}")
                print(f"  - Policies count: {len(compiled_json.get('policies', []))}")
                for i, policy in enumerate(compiled_json.get('policies', [])):
                    print(f"    Policy {i+1}: {policy['type']} {policy['actions']} on {policy['resource']}")
                    if policy.get('condition'):
                        print(f"      Condition: {policy['condition']}")
                
                return True
            else:
                print("✗ No active policy found in database")
                return False
        except Exception as e:
            print(f"✗ Error reloading policy engine: {e}")
            import traceback
            traceback.print_exc()
            return False
    return False


def clear_and_populate_database(ast, source_code, compiled_json):
    """Clear database and repopulate with data from AST"""
    global _current_engine
    
    if not DB_AVAILABLE or not db:
        return False
    
    try:
        extractor = SPLDataExtractor()
        extractor.visit(ast)
        
        # Clear existing data
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM audit_logs')
            cursor.execute('DELETE FROM compiled_policies')
            cursor.execute('DELETE FROM users')
            cursor.execute('DELETE FROM resources')
            conn.commit()
        
        print(f"✓ Database cleared")
        
        # Populate users
        for user in extractor.users:
            try:
                db.create_user(
                    username=user['username'],
                    role=user['role'],
                    email=user['email'],
                    department=user['department']
                )
                print(f"  ✓ Created user: {user['username']} ({user['role']})")
            except Exception as e:
                print(f"  ✗ Failed to create user {user['username']}: {e}")
        
        # Populate resources
        for resource in extractor.resources:
            try:
                db.create_resource(
                    name=resource['name'],
                    type=resource['type'],
                    path=resource['path'],
                    description=resource['description'],
                    owner=resource['owner']
                )
                print(f"  ✓ Created resource: {resource['name']}")
            except Exception as e:
                print(f"  ✗ Failed to create resource {resource['name']}: {e}")
        
        # Save compiled policy
        policy_id = db.save_compiled_policy(
            name='auto_compiled_policy',
            source_code=source_code,
            compiled_json=json.dumps(compiled_json),
            created_by='system'
        )
        
        # Activate in engine
        _current_engine = PolicyEngine(compiled_json)
        
        # Force reload to ensure consistency
        force_reload_engine()
        
        print(f"✓ Policy saved (ID: {policy_id}) and activated")
        print(f"✓ Database populated with {len(extractor.users)} users and {len(extractor.resources)} resources")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to populate database: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# COMPILER ROUTES
# ============================================================================

@api.route('/tokenize', methods=['POST'])
def tokenize():
    """Tokenize SPL source code"""
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        lexer.build()
        tokens = lexer.tokenize(source_code)
        
        token_list = [
            {
                "type": token[0],
                "value": str(token[1]),
                "line": token[2]
            }
            for token in tokens
        ]
        
        return jsonify({
            "success": True,
            "tokens": token_list,
            "token_count": len(token_list)
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/parse', methods=['POST'])
def parse():
    """Parse SPL source code and generate AST"""
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            return jsonify({
                "success": False,
                "errors": parser.errors,
                "ast": None
            }), 400
        
        return jsonify({
            "success": True,
            "ast": str(ast),
            "errors": []
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/compile', methods=['POST'])
def compile_spl():
    """Full compilation: Tokenize + Parse + Semantic Analysis + Code Generation"""
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'code' field in request body"
            }), 400
        
        print("=" * 60)
        print("COMPILING SPL CODE")
        print("=" * 60)
        
        source_code = data['code']
        should_analyze = data.get('analyze', True)
        generate_code = data.get('generate_code', False)
        target_format = data.get('format', 'json')
        
        # Step 1: Tokenization
        lexer.build()
        tokens = lexer.tokenize(source_code)
        
        token_list = [
            {
                "type": token[0],
                "value": str(token[1]),
                "line": token[2]
            }
            for token in tokens
        ]
        
        # Step 2: Parsing
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            frontend_errors = []
            for error_msg in parser.errors:
                if "line" in error_msg:
                    try:
                        line_part = error_msg.split("line")[1].split(":")[0].strip()
                        line_number = int(line_part)
                        message = error_msg.split(": ", 1)[1] if ": " in error_msg else error_msg
                        
                        frontend_errors.append({
                            "line": line_number,
                            "message": message,
                            "type": "ERROR"
                        })
                    except (IndexError, ValueError):
                        frontend_errors.append({
                            "line": 1,
                            "message": error_msg,
                            "type": "ERROR"
                        })
                else:
                    frontend_errors.append({
                        "line": 1,
                        "message": error_msg,
                        "type": "ERROR"
                    })
            
            return jsonify({
                "success": False,
                "stage": "parsing",
                "errors": frontend_errors,
                "tokens": token_list,
                "stages": {
                    "tokenization": {
                        "success": True,
                        "token_count": len(token_list),
                        "tokens": token_list
                    },
                    "parsing": {
                        "success": False,
                        "errors": parser.errors
                    }
                }
            }), 200
        
        response = {
            "success": True,
            "stages": {
                "tokenization": {
                    "success": True,
                    "token_count": len(token_list),
                    "tokens": token_list
                },
                "parsing": {
                    "success": True,
                    "ast": str(ast),
                    "errors": []
                }
            }
        }
        
        # Step 3: Semantic Analysis
        print("\n--- Running Semantic Analysis ---")
        analyzer = SemanticAnalyzer()
        semantic_results = analyzer.analyze(ast)
        
        response["stages"]["semantic_analysis"] = {
            "success": semantic_results["success"],
            "errors": semantic_results["errors"],
            "warnings": semantic_results["warnings"],
            "conflicts": semantic_results["conflicts"],
            "statistics": semantic_results["statistics"]
        }
        
        if not semantic_results["success"]:
            print(f"✗ Semantic analysis failed with {len(semantic_results['errors'])} error(s)")
            for error in semantic_results["errors"]:
                print(f"  - Line {error['line']}: {error['message']}")
            
            frontend_errors = []
            for error in semantic_results["errors"]:
                frontend_errors.append({
                    "line": error["line"],
                    "message": error["message"],
                    "type": error["type"]
                })
            
            response["success"] = False
            response["stage"] = "semantic_analysis"
            response["errors"] = frontend_errors
            response["message"] = "Compilation blocked due to semantic errors"
            
            print("\n✗ COMPILATION BLOCKED - Fix semantic errors before proceeding\n")
            return jsonify(response), 200
        
        print("✓ Semantic analysis passed")
        
        # Step 4: Code Generation
        compiled_json = None
        if generate_code:
            print("\n--- Generating Code ---")
            from compiler.code_generator import CodeGenerator
            generator = CodeGenerator(target_format)
            generated_code = generator.generate(ast)
            
            response["stages"]["code_generation"] = {
                "success": generated_code is not None,
                "target_format": target_format,
                "generated_code": generated_code,
                "supported_formats": generator.get_supported_formats()
            }
            
            if target_format == 'json' and generated_code:
                try:
                    compiled_json = json.loads(generated_code)
                    print("✓ Code generation successful")
                except json.JSONDecodeError:
                    print("✗ Warning: Generated code is not valid JSON")
        
        # Step 5: Database Update
        if compiled_json and DB_AVAILABLE:
            print("\n--- Updating Database ---")
            database_updated = clear_and_populate_database(ast, source_code, compiled_json)
            response["database_updated"] = database_updated
            
            if database_updated:
                response["message"] = "Policy compiled successfully, database cleared and repopulated"
                print("\n✓ COMPILATION SUCCESSFUL - Policy active and database updated\n")
            else:
                response["message"] = "Policy compiled but could not update database"
                print("\n⚠ COMPILATION SUCCESSFUL - But database update failed\n")
        else:
            response["database_updated"] = False
            if not DB_AVAILABLE:
                response["message"] = "Policy compiled successfully (database not available)"
            elif not compiled_json:
                response["message"] = "Policy compiled successfully (no JSON output to save)"
        
        return jsonify(response)
    
    except Exception as e:
        print(f"✗ Compilation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/validate', methods=['POST'])
def validate():
    """Validate SPL code without full compilation"""
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            return jsonify({
                "valid": False,
                "stage": "parsing",
                "errors": parser.errors
            })
        
        analyzer = SemanticAnalyzer()
        semantic_results = analyzer.analyze(ast)
        
        if not semantic_results["success"]:
            return jsonify({
                "valid": False,
                "stage": "semantic_analysis",
                "errors": semantic_results["errors"],
                "warnings": semantic_results["warnings"],
                "conflicts": semantic_results["conflicts"]
            })
        
        return jsonify({
            "valid": True,
            "message": "Code is valid",
            "errors": [],
            "warnings": semantic_results["warnings"],
            "conflicts": semantic_results["conflicts"]
        })
    
    except Exception as e:
        return jsonify({
            "valid": False,
            "error": str(e)
        }), 500


@api.route('/analyze', methods=['POST'])
def analyze_semantics():
    """Perform semantic analysis on SPL code"""
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            return jsonify({
                "success": False,
                "stage": "parsing",
                "errors": parser.errors
            }), 400
        
        analyzer = SemanticAnalyzer()
        results = analyzer.analyze(ast)
        
        return jsonify(results)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================================
# EXECUTION ROUTES
# ============================================================================

@api.route('/execution/check-access', methods=['POST'])
def check_access():
    """Check if user has access to perform action on resource"""
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
        
        result = engine.check_access(username, action, resource, context)
        
        # Log to audit
        database = get_db()
        if database:
            ip_address = context.get('ip_address', request.remote_addr)
            try:
                database.log_access(
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


@api.route('/execution/user-permissions/<username>', methods=['GET'])
def get_user_permissions(username):
    """Get all permissions for a specific user"""
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


@api.route('/execution/users', methods=['GET'])
def get_users():
    """Get all users (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        users = database.get_all_users()
        
        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@api.route('/execution/users/<username>', methods=['GET'])
def get_user(username):
    """Get specific user (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        user = database.get_user(username)
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


@api.route('/execution/resources', methods=['GET'])
def get_resources():
    """Get all resources (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        resources = database.get_all_resources()
        
        return jsonify({
            'success': True,
            'resources': resources,
            'count': len(resources)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@api.route('/execution/resources/<name>', methods=['GET'])
def get_resource(name):
    """Get specific resource (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        resource = database.get_resource(name)
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


@api.route('/execution/policies', methods=['GET'])
def get_policies():
    """Get active policy (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        policy = database.get_active_policy()
        
        if policy:
            return jsonify([{
                'id': policy['id'],
                'name': policy['name'],
                'version': policy['version'],
                'created_at': policy['created_at'],
                'active': True,
                'created_by': policy.get('created_by', 'system')
            }])
        else:
            return jsonify([])
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@api.route('/execution/policies/<int:policy_id>', methods=['GET'])
def get_policy_details(policy_id):
    """Get policy details (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        with database.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM compiled_policies WHERE id = ?', (policy_id,))
            policy = cursor.fetchone()
            
            if not policy:
                return jsonify({
                    'error': f'Policy with ID {policy_id} not found'
                }), 404
            
            policy_dict = dict(policy)
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


@api.route('/execution/policies/<name>/history', methods=['GET'])
def get_policy_history(name):
    """Get policy version history (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        history = database.get_policy_history(name)
        
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


@api.route('/execution/policies/source', methods=['GET'])
def get_active_policy_source():
    """Get source code for active policy (READ ONLY)"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        policy = database.get_active_policy()
        
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


@api.route('/execution/audit-logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        username = request.args.get('username')
        resource = request.args.get('resource')
        limit = int(request.args.get('limit', 100))
        
        logs = database.get_audit_logs(username, resource, limit)
        
        return jsonify({
            'success': True,
            'logs': logs,
            'count': len(logs)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@api.route('/execution/statistics', methods=['GET'])
def get_statistics():
    """Get access statistics"""
    try:
        database = get_db()
        if not database:
            return jsonify({
                'error': 'Database not available'
            }), 500
        
        stats = database.get_access_statistics()
        users = database.get_all_users()
        resources = database.get_all_resources()
        
        with database.get_connection() as conn:
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


# ============================================================================
# HEALTH CHECK ROUTES
# ============================================================================

@api.route('/health', methods=['GET'])
def health_check():
    """API health check"""
    database = get_db()
    engine = get_policy_engine()
    
    return jsonify({
        "status": "healthy",
        "compiler": "ready",
        "database": "available" if database else "unavailable",
        "policy_engine": "active" if engine else "inactive"
    })


@api.route('/execution/health', methods=['GET'])
def execution_health_check():
    """Execution engine health check"""
    database = get_db()
    engine = get_policy_engine()
    
    return jsonify({
        'status': 'healthy',
        'database': 'available' if database else 'unavailable',
        'policy_engine': 'active' if engine else 'inactive'
    })


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@api.errorhandler(404)
def api_not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "API endpoint not found",
        "message": "Please check the API documentation"
    }), 404


@api.errorhandler(500)
def api_internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error in API",
        "message": str(error)
    }), 500
