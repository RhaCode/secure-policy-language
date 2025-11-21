"""
Flask Application Entry Point for SPL Compiler
Main backend server that handles app configuration and startup
"""

from flask import Flask, jsonify
from flask_cors import CORS
import sys
import os

# Add compiler directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'compiler'))

# Import API Blueprint
from api.routes import api

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for frontend communication
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register API Blueprint with URL prefix
app.register_blueprint(api, url_prefix='/api')

@app.route('/')
def home():
    """Health check and server info endpoint"""
    return jsonify({
        "status": "running",
        "message": "SPL Compiler API is active",
        "version": "1.0.0",
        "endpoints": {
            "compile": "/api/compile",
            "tokenize": "/api/tokenize", 
            "parse": "/api/parse",
            "validate": "/api/validate",
            "analyze": "/api/analyze",
            "health": "/api/health"
        }
    })

# Global error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors for non-API routes"""
    return jsonify({
        "error": "Endpoint not found",
        "message": "Please check the server documentation"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors for non-API routes"""
    return jsonify({
        "error": "Internal server error",
        "message": str(error)
    }), 500

# Development server configuration
if __name__ == '__main__':
    print("=" * 60)
    print("SPL Compiler API Server")
    print("=" * 60)
    print("Server starting on http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /               - Server info")
    print("  GET  /api/health     - Health check")
    print("  POST /api/tokenize   - Tokenize SPL code")
    print("  POST /api/parse      - Parse SPL code") 
    print("  POST /api/compile    - Full compilation")
    print("  POST /api/validate   - Validate syntax")
    print("  POST /api/analyze    - Semantic analysis")
    print("=" * 60)
    print("\nPress CTRL+C to stop the server\n")
    
    # Run development server
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=5000,
        debug=True  # Enable debug mode for development
    )