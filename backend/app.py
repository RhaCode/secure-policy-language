"""
backend/app.py
SPL Compiler & Execution Engine - Azure Compatible Version
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from api.routes import api
from api.execution_routes import execution_api
from api.crud_routes import crud_api


app = Flask(__name__, static_folder="static", static_url_path="")

# Create absolute path to the static directory
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# -------------------------
# FRONTEND ROUTE
# -------------------------

@app.route("/")
def serve_frontend():
    """Serve the SPA frontend (index.html)"""
    return send_from_directory(STATIC_DIR, "index.html")


# -------------------------
# CORS CONFIG
# -------------------------

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://*.azurewebsites.net"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# -------------------------
# BLUEPRINTS
# -------------------------

app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(execution_api)
app.register_blueprint(crud_api)

# -------------------------
# BACKEND INFO ROUTE
# -------------------------

@app.route('/api-info')
def api_info():
    """Backend diagnostic info"""
    return jsonify({
        "name": "Secure Policy Language (SPL) Compiler & Execution Engine",
        "version": "1.0.0",
        "status": "running",
        "environment": os.environ.get("WEBSITE_SITE_NAME", "local"),
        "port": os.environ.get("PORT", "not set"),
        "health": "/health",
        "api_base": "/api"
    })

# -------------------------
# HEALTH CHECK
# -------------------------

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "SPL Compiler & Execution Engine",
        "components": {
            "compiler": "operational",
            "execution_engine": "operational",
            "crud_operations": "operational",
            "database": "connected"
        }
    })

# -------------------------
# ERROR HANDLERS
# -------------------------

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Not Found",
        "message": "Endpoint does not exist",
        "hint": "Try /api or /health"
    }), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        "error": "Internal Server Error",
        "message": str(e)
    }), 500

# -------------------------
# LOCAL DEV RUN
# -------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))

    print("\n" + "=" * 70)
    print("🚀 SPL COMPILER & EXECUTION ENGINE")
    print(f"🌎 Running on: http://0.0.0.0:{port}")
    print(f"🧠 Environment: {os.environ.get('WEBSITE_SITE_NAME', 'local')}")
    print("=" * 70)

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
