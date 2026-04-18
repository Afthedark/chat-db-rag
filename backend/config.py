"""
Configuration module for Flask backend.
Loads settings from environment variables.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class."""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Session settings
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'flask_session')
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    
    # Ollama settings
    OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434/api/chat')
    OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', '120'))
    OLLAMA_MAX_RETRIES = int(os.getenv('OLLAMA_MAX_RETRIES', '3'))
    OLLAMA_RETRY_DELAY = int(os.getenv('OLLAMA_RETRY_DELAY', '2'))
    OLLAMA_CONTEXT_LIMIT = int(os.getenv('OLLAMA_CONTEXT_LIMIT', '8192'))
    MAX_CHAT_HISTORY = int(os.getenv('MAX_CHAT_HISTORY', '5'))
    
    # Gemini settings
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY_ID_1', '')
    
    # CORS settings - allow all origins for local network sharing
    # In production, restrict this to specific domains
    CORS_ORIGINS = "*"
    
    # SQLAlchemy settings for project persistence
    # Build DATABASE_URL from separate variables or use direct URL
    @staticmethod
    def build_database_url():
        """Build DATABASE_URL from separate variables or use direct URL."""
        # Check if direct URL is provided
        direct_url = os.getenv('DATABASE_URL', '')
        if direct_url:
            return direct_url
        
        # Build from separate variables
        driver = os.getenv('DB_DRIVER', 'mysql+mysqlconnector')
        user = os.getenv('DB_USER', 'root')
        password = os.getenv('DB_PASSWORD', '')
        host = os.getenv('DB_HOST', 'localhost')
        port = os.getenv('DB_PORT', '3306')
        name = os.getenv('DB_NAME', 'chat_db_rag')
        
        if password:
            return f"{driver}://{user}:{password}@{host}:{port}/{name}"
        else:
            return f"{driver}://{user}@{host}:{port}/{name}"
    
    SQLALCHEMY_DATABASE_URI = build_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Encryption key for password storage
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', '')
