"""
Flask backend for Chat with MySQL.
Provides REST API for the vanilla JavaScript frontend.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_session import Session

from config import Config
from models.database import db
from routes.chat import chat_bp
from routes.database import database_bp
from routes.models import models_bp
from routes.connections import connections_bp
from routes.chats import chats_bp

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = Config.SQLALCHEMY_TRACK_MODIFICATIONS
db.init_app(app)

# Create tables within app context
with app.app_context():
    db.create_all()
    print("Database tables initialized successfully!")

# Enable CORS for frontend
CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

# Configure session
Session(app)

# Ensure session directory exists
os.makedirs(Config.SESSION_FILE_DIR, exist_ok=True)

# Register blueprints
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(database_bp, url_prefix='/api/database')
app.register_blueprint(models_bp, url_prefix='/api/models')
app.register_blueprint(connections_bp, url_prefix='/api')
app.register_blueprint(chats_bp, url_prefix='/api')


@app.route('/')
def index():
    """Root endpoint - API info."""
    return jsonify({
        'name': 'Chat with MySQL API',
        'version': '2.0.0',
        'features': [
            'Multi-connection database support',
            'Persistent chat history',
            'SQLAlchemy ORM persistence'
        ],
        'endpoints': {
            'chat': '/api/chat',
            'database': '/api/database',
            'models': '/api/models',
            'connections': '/api/connections',
            'chats': '/api/chats'
        }
    })


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'chat-with-mysql-api'
    })


if __name__ == '__main__':
    print("Starting Chat with MySQL API server...")
    print(f"API available at: http://localhost:5000")
    print(f"CORS enabled for: {Config.CORS_ORIGINS}")
    app.run(debug=True, host='0.0.0.0', port=5000)
