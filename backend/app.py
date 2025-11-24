"""
backend/app.py
Flask Application with Compiler, Execution Engine, and CRUD Management - UPDATED
"""

from flask import Flask, jsonify
from flask_cors import CORS
from api.routes import api
from api.execution_routes import execution_api
from api.crud_routes import crud_api

app = Flask(__name__)

# Enable CORS for frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Register blueprints with proper prefixes
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(execution_api)  # Already has /api/execution prefix in blueprint
app.register_blueprint(crud_api)  # Already has /api/crud prefix in blueprint

@app.route('/')
def index():
    """Root endpoint with comprehensive API documentation"""
    return jsonify({
        "name": "Secure Policy Language (SPL) Compiler & Execution Engine",
        "version": "1.0.0",
        "description": "Complete policy management system with compilation, execution, and CRUD operations",
        "endpoints": {
            "compiler": {
                "health": "/api/health",
                "compile": "/api/compile",
                "tokenize": "/api/tokenize",
                "parse": "/api/parse",
                "validate": "/api/validate",
                "analyze": "/api/analyze",
                "debug_tokens": "/api/debug-tokens"
            },
            "execution": {
                "policy": {
                    "check_access": "/api/execution/check-access",
                    "activate_policy": "/api/execution/activate-policy",
                    "get_policies": "/api/execution/policies",
                    "policy_history": "/api/execution/policies/<name>/history",
                    "user_permissions": "/api/execution/user-permissions/<username>"
                },
                "users": {
                    "list_create": "/api/execution/users",
                    "get_update_delete": "/api/execution/users/<username>"
                },
                "resources": {
                    "list_create": "/api/execution/resources",
                    "get_update_delete": "/api/execution/resources/<name>"
                },
                "audit": {
                    "logs": "/api/execution/audit-logs",
                    "statistics": "/api/execution/statistics"
                },
                "health": "/api/execution/health"
            },
            "crud": {
                "users": {
                    "list": "/api/crud/users",
                    "create": "/api/crud/users",
                    "get": "/api/crud/users/<username>",
                    "update": "/api/crud/users/<username>",
                    "delete": "/api/crud/users/<username>"
                },
                "resources": {
                    "list": "/api/crud/resources",
                    "create": "/api/crud/resources",
                    "get": "/api/crud/resources/<name>",
                    "update": "/api/crud/resources/<name>",
                    "delete": "/api/crud/resources/<name>"
                },
                "policies": {
                    "list": "/api/crud/policies",
                    "get": "/api/crud/policies/<int:policy_id>",
                    "history": "/api/crud/policies/history/<name>",
                    "activate": "/api/crud/policies/<int:policy_id>/activate",
                    "delete": "/api/crud/policies/<int:policy_id>"
                },
                "statistics": "/api/crud/statistics",
                "health": "/api/crud/health"
            }
        }
    })

@app.route('/health')
def health():
    """Global health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "service": "SPL Compiler & Execution Engine",
        "components": {
            "compiler": "operational",
            "execution_engine": "operational",
            "crud_operations": "operational",
            "database": "operational"
        }
    })

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found",
        "message": "The requested endpoint does not exist. Check /api/ for available endpoints."
    }), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error",
        "message": str(e)
    }), 500

if __name__ == '__main__':
    print("=" * 70)
    print("SPL COMPILER & EXECUTION ENGINE")
    print("=" * 70)
    print("Starting server on http://localhost:5000")
    print("\n📋 Available API Groups:")
    print("  ✓ Compiler API:   http://localhost:5000/api/*")
    print("  ✓ Execution API:  http://localhost:5000/api/execution/*")
    print("  ✓ CRUD API:       http://localhost:5000/api/crud/*")
    print("\n🔧 Key Features:")
    print("  • Policy compilation & validation")
    print("  • Runtime access control")
    print("  • User & resource management (CRUD)")
    print("  • Policy versioning & activation")
    print("  • Audit logging & statistics")
    print("\n📚 Documentation: http://localhost:5000/")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5000)