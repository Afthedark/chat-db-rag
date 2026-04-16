"""
SQLAlchemy models for project persistence.
Handles database connections, chats, and messages.
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class UserConnection(db.Model):
    """Saved database connections for the user."""
    __tablename__ = 'user_connections'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # Friendly name
    host = db.Column(db.String(255), nullable=False)
    port = db.Column(db.Integer, default=3306)
    username = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Encrypted
    database_name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chats = db.relationship('Chat', backref='connection', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary (without password)."""
        return {
            'id': self.id,
            'name': self.name,
            'host': self.host,
            'port': self.port,
            'username': self.username,
            'database_name': self.database_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Chat(db.Model):
    """Chat sessions."""
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    connection_id = db.Column(db.Integer, db.ForeignKey('user_connections.id'), nullable=False)
    provider = db.Column(db.String(50), default='ollama')  # ollama or gemini
    model_name = db.Column(db.String(100), default='llama3.1:8b')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='chat', lazy=True, 
                               cascade='all, delete-orphan', 
                               order_by='Message.created_at')
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'connection_id': self.connection_id,
            'connection_name': self.connection.name if self.connection else None,
            'database_name': self.connection.database_name if self.connection else None,
            'provider': self.provider,
            'model_name': self.model_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Message(db.Model):
    """Chat messages."""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    sql_query = db.Column(db.Text, nullable=True)  # Optional SQL query
    sql_results = db.Column(db.Text, nullable=True)  # Optional SQL results
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'role': self.role,
            'content': self.content,
            'sql_query': self.sql_query,
            'sql_results': self.sql_results,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
