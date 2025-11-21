"""
backend/api/routes.py
API Routes for SPL Compiler
All endpoints for the Secure Policy Language compiler
"""

from flask import Blueprint, request, jsonify
from compiler.semantic_analyzer import SemanticAnalyzer
from compiler.lexer import SPLLexer
from compiler.parser import SPLParser
from compiler.ast_nodes import ASTPrinter

# Create Blueprint for API routes
api = Blueprint('api', __name__)

# Initialize compiler components
lexer = SPLLexer()
parser = SPLParser()

@api.route('/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        "status": "healthy",
        "compiler": "ready"
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
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400
        
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
        
        if ast is None:
            return jsonify({
                "success": False,
                "stage": "parsing",
                "errors": parser.errors,
                "tokens": token_list
            }), 400
        
        # Prepare response
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