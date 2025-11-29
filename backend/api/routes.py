"""
backend/api/routes.py
API Routes for SPL Compiler - SOURCE CODE AS SINGLE SOURCE OF TRUTH
Users, Resources, and Policies are all defined in SPL code
Database is cleared and repopulated on each compilation
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

# Create Blueprint for API routes
api = Blueprint('api', __name__)

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
    """
    Extract users, resources, and policies from AST
    for database population
    """
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
        # Policies are handled by code generator
        pass
    
    def visit_BinaryOpNode(self, node):
        # No extraction needed for expressions
        pass
    
    def visit_UnaryOpNode(self, node):
        # No extraction needed for expressions
        pass
    
    def visit_AttributeNode(self, node):
        # No extraction needed for expressions
        pass
    
    def visit_LiteralNode(self, node):
        # No extraction needed for literals
        pass


def clear_and_populate_database(ast, source_code, compiled_json):
    """
    Clear database and repopulate with data from AST
    Returns True if successful, False otherwise
    """
    global _current_engine
    
    if not DB_AVAILABLE or not db:
        return False
    
    try:
        # Extract data from AST
        extractor = SPLDataExtractor()
        extractor.visit(ast)
        
        # Clear existing data
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Clear tables (keep schema)
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
        
        print(f"✓ Policy saved (ID: {policy_id}) and activated")
        print(f"✓ Database populated with {len(extractor.users)} users and {len(extractor.resources)} resources")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to populate database: {e}")
        return False


@api.route('/tokenize', methods=['POST'])
def tokenize():
    """
    Tokenize SPL source code
    
    Request body:
    {
        "code": "ROLE Admin { can: * }"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        # Tokenize the code
        lexer.build()
        tokens = lexer.tokenize(source_code)
        
        # Format tokens for response
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
    """
    Parse SPL source code and generate AST
    
    Request body:
    {
        "code": "ROLE Admin { can: * }"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        # Parse the code
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            return jsonify({
                "success": False,
                "errors": parser.errors,
                "ast": None
            }), 400
        
        # Convert AST to string representation
        ast_string = str(ast)
        
        return jsonify({
            "success": True,
            "ast": ast_string,
            "errors": []
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/compile', methods=['POST'])
def compile_spl():
    """
    Full compilation: Tokenize + Parse + Semantic Analysis + Code Generation
    AUTOMATICALLY clears database and repopulates with data from source code
    
    CRITICAL: Compilation is BLOCKED if semantic errors are detected
    """
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
        should_analyze = data.get('analyze', True)  # Default to True for safety
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
        
        # Handle parsing errors
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
        
        # Prepare response for successful parsing
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
        
        # Step 3: Semantic Analysis (ALWAYS run for safety)
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
        
        # CRITICAL CHECK: Block compilation if semantic errors exist
        if not semantic_results["success"]:
            print(f"✗ Semantic analysis failed with {len(semantic_results['errors'])} error(s)")
            for error in semantic_results["errors"]:
                print(f"  - Line {error['line']}: {error['message']}")
            
            # Convert semantic errors to frontend format
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
        
        # Step 4: Code Generation (only if semantic analysis passed)
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
            
            # Parse the generated JSON for storage
            if target_format == 'json' and generated_code:
                try:
                    compiled_json = json.loads(generated_code)
                    print("✓ Code generation successful")
                except json.JSONDecodeError:
                    print("✗ Warning: Generated code is not valid JSON")
        
        # Step 5: CLEAR DATABASE AND REPOPULATE FROM SOURCE CODE
        # Only proceed if semantic analysis passed
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
    """
    Validate SPL code without full compilation
    Returns BOTH syntax AND semantic errors
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        # Step 1: Parse to check for syntax errors
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            return jsonify({
                "valid": False,
                "stage": "parsing",
                "errors": parser.errors
            })
        
        # Step 2: Run semantic analysis
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
        
        # If we have warnings but no errors, still mark as valid
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
    """
    Perform semantic analysis on SPL code
    Detects conflicts, security risks, and validates references
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        # Parse the code first
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            return jsonify({
                "success": False,
                "stage": "parsing",
                "errors": parser.errors
            }), 400
        
        # Run semantic analysis
        analyzer = SemanticAnalyzer()
        results = analyzer.analyze(ast)
        
        return jsonify(results)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        "status": "healthy",
        "compiler": "ready",
        "database": "available" if DB_AVAILABLE else "unavailable"
    })


# Error handlers for the API Blueprint
@api.errorhandler(404)
def api_not_found(error):
    """Handle 404 errors for API endpoints"""
    return jsonify({
        "error": "API endpoint not found",
        "message": "Please check the API documentation"
    }), 404


@api.errorhandler(500)
def api_internal_error(error):
    """Handle 500 errors for API endpoints"""
    return jsonify({
        "error": "Internal server error in API",
        "message": str(error)
    }), 500