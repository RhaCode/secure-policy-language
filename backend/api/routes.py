"""
backend/api/routes.py
API Routes for SPL Compiler - WITH AUTOMATIC POLICY STORAGE
All endpoints for the Secure Policy Language compiler
"""

from flask import Blueprint, request, jsonify
from compiler.semantic_analyzer import SemanticAnalyzer
from compiler.lexer import SPLLexer
from compiler.parser import SPLParser
from compiler.ast_nodes import ASTPrinter
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
    db.initialize_sample_data()
    _current_engine = None
else:
    db = None
    _current_engine = None


def save_and_activate_policy(source_code: str, compiled_json: dict) -> bool:
    """
    Save compiled policy to database and activate it
    Returns True if successful, False otherwise
    """
    global _current_engine
    
    if not DB_AVAILABLE or not db:
        return False
    
    try:
        # Save to database
        policy_id = db.save_compiled_policy(
            name='auto_compiled_policy',
            source_code=source_code,
            compiled_json=json.dumps(compiled_json),
            created_by='system'
        )
        
        # Activate in engine
        _current_engine = PolicyEngine(compiled_json)
        
        print(f"✓ Policy saved (ID: {policy_id}) and activated successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to save/activate policy: {e}")
        return False


@api.route('/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        "status": "healthy",
        "compiler": "ready",
        "database": "available" if DB_AVAILABLE else "unavailable"
    })

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
    AUTOMATICALLY saves and activates policy on successful compilation
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'code' field in request body"
            }), 400
        
        print("Data received for compilation:", data)
        source_code = data['code']
        should_analyze = data.get('analyze', False)
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
        
        # Even if parsing fails, return the errors to frontend
        if ast is None:
            # Convert parser errors to frontend format
            frontend_errors = []
            for error_msg in parser.errors:
                # Parse error message to extract line number and message
                # Format: "Syntax error at line X: Unexpected token 'Y' (type: Z)"
                if "line" in error_msg:
                    try:
                        # Extract line number
                        line_part = error_msg.split("line")[1].split(":")[0].strip()
                        line_number = int(line_part)
                        
                        # Extract message
                        message = error_msg.split(": ", 1)[1] if ": " in error_msg else error_msg
                        
                        frontend_errors.append({
                            "line": line_number,
                            "message": message,
                            "type": "ERROR"
                        })
                    except (IndexError, ValueError):
                        # Fallback if parsing fails
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
            }), 200  # Return 200 with error details instead of 400
        
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
        
        # Step 3: Semantic Analysis (if requested)
        if should_analyze:
            analyzer = SemanticAnalyzer()
            semantic_results = analyzer.analyze(ast)
            
            response["stages"]["semantic_analysis"] = {
                "success": semantic_results["success"],
                "errors": semantic_results["errors"],
                "warnings": semantic_results["warnings"],
                "conflicts": semantic_results["conflicts"],
                "statistics": semantic_results["statistics"]
            }
        
        # Step 4: Code Generation (if requested)
        compiled_json = None
        if generate_code:
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
                except json.JSONDecodeError:
                    print("Warning: Generated code is not valid JSON")
        
        # Step 5: AUTOMATIC POLICY STORAGE & ACTIVATION
        if compiled_json and DB_AVAILABLE:
            policy_saved = save_and_activate_policy(source_code, compiled_json)
            response["policy_activated"] = policy_saved
            
            if policy_saved:
                response["message"] = "Policy compiled, saved, and activated successfully"
            else:
                response["message"] = "Policy compiled but could not be saved to database"
        else:
            response["policy_activated"] = False
            if not DB_AVAILABLE:
                response["message"] = "Policy compiled successfully (database not available)"
            elif not compiled_json:
                response["message"] = "Policy compiled successfully (no JSON output to save)"
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api.route('/validate', methods=['POST'])
def validate():
    """
    Validate SPL code without full compilation
    Returns syntax errors if any
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
        source_code = data['code']
        
        # Parse to check for errors
        parser.build()
        ast = parser.parse(source_code)
        
        if ast is None:
            return jsonify({
                "valid": False,
                "errors": parser.errors
            })
        
        return jsonify({
            "valid": True,
            "message": "Code is syntactically valid",
            "errors": []
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

@api.route('/debug-tokens', methods=['POST'])
def debug_tokens():
    """Debug endpoint to see tokenization results"""
    try:
        data = request.get_json()
        source_code = data['code']
        
        lexer.build()
        tokens = lexer.tokenize(source_code)
        
        return jsonify({
            "tokens": [
                {
                    "type": token[0],
                    "value": str(token[1]),
                    "line": token[2]
                }
                for token in tokens
            ],
            "total_tokens": len(tokens)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500