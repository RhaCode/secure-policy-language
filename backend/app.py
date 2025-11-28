"""
backend/app.py
Flask Application - SPL Compiler & Execution Engine
SOURCE CODE AS SINGLE SOURCE OF TRUTH
No manual CRUD operations - all data comes from compiled SPL code
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os

# Import API blueprints
from api.routes import api
from api.execution_routes import execution_api
# REMOVED: crud_routes - No longer needed

def create_app():
    """Application factory"""
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JSON_SORT_KEYS'] = False
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(execution_api)  # Already has /api/execution prefix
    # REMOVED: app.register_blueprint(crud_api)
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            "name": "Secure Policy Language (SPL) Compiler & Execution Engine",
            "version": "2.0",
            "description": "Source code as single source of truth - no manual CRUD operations",
            "endpoints": {
                "compiler": {
                    "tokenize": "POST /api/tokenize",
                    "parse": "POST /api/parse",
                    "compile": "POST /api/compile",
                    "validate": "POST /api/validate",
                    "analyze": "POST /api/analyze",
                    "health": "GET /api/health"
                },
                "execution": {
                    "check_access": "POST /api/execution/check-access",
                    "user_permissions": "GET /api/execution/user-permissions/<username>",
                    "users": "GET /api/execution/users (READ ONLY)",
                    "user_detail": "GET /api/execution/users/<username> (READ ONLY)",
                    "resources": "GET /api/execution/resources (READ ONLY)",
                    "resource_detail": "GET /api/execution/resources/<name> (READ ONLY)",
                    "policies": "GET /api/execution/policies (READ ONLY)",
                    "policy_detail": "GET /api/execution/policies/<id> (READ ONLY)",
                    "policy_history": "GET /api/execution/policies/<name>/history (READ ONLY)",
                    "audit_logs": "GET /api/execution/audit-logs",
                    "statistics": "GET /api/execution/statistics",
                    "health": "GET /api/execution/health"
                }
            },
            "notes": [
                "All users, resources, and policies are defined in SPL source code",
                "Compiling new policy clears database and repopulates from source",
                "No manual CRUD operations available",
                "Read-only endpoints provided for frontend UI"
            ]
        })
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found",
            "status": 404
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "status": 500
        }), 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    
    print("\n" + "=" * 60)
    print("AuthScript COMPILER & EXECUTION ENGINE")
    print("=" * 60)
    print("\n✓ Server starting...")
    print("✓ Compiler API: http://localhost:5000/api/")
    print("✓ Execution API: http://localhost:5000/api/execution/")
    print("\nPress CTRL+C to stop\n")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )