"""
backend/app.py
Flask Application with Compiler and Execution Engine
"""

from flask import Flask
from flask_cors import CORS
from api.routes import api
from api.execution_routes import execution_api

app = Flask(__name__)

# Enable CORS for frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Register blueprints
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(execution_api, url_prefix='/api/execution')

@app.route('/')
def index():
    """Root endpoint"""
    return {
        "name": "Secure Policy Language (SPL) Compiler",
        "version": "1.0.0",
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
                "check_access": "/api/execution/check-access",
                "activate_policy": "/api/execution/activate-policy",
                "users": "/api/execution/users",
                "resources": "/api/execution/resources",
                "audit_logs": "/api/execution/audit-logs",
                "statistics": "/api/execution/statistics"
            }
        }
    }

@app.route('/health')
def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "SPL Compiler & Execution Engine"}

if __name__ == '__main__':
    print("=" * 70)
    print("SPL COMPILER & EXECUTION ENGINE")
    print("=" * 70)
    print("Starting server on http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  Compiler API: http://localhost:5000/api/*")
    print("  Execution API: http://localhost:5000/api/execution/*")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5000)