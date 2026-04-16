"""
Chats routes for Flask backend.
Handles chat sessions and messages with persistence.
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime
from models.database import db, Chat, Message, UserConnection
from services.encryption import decrypt_password
from services.database import db_manager

chats_bp = Blueprint('chats', __name__)


@chats_bp.route('/chats', methods=['GET'])
def list_chats():
    """List all chats."""
    chats = Chat.query.filter_by(is_active=True).order_by(Chat.updated_at.desc()).all()
    return jsonify({
        'success': True,
        'chats': [c.to_dict() for c in chats]
    })


@chats_bp.route('/chats', methods=['POST'])
def create_chat():
    """Create a new chat."""
    data = request.json
    
    # Validate required fields
    if 'connection_id' not in data:
        return jsonify({'success': False, 'error': 'connection_id is required'}), 400
    
    # Verify connection exists
    connection = UserConnection.query.get(data['connection_id'])
    if not connection:
        return jsonify({'success': False, 'error': 'Connection not found'}), 404
    
    try:
        chat = Chat(
            title=data.get('title', f'Chat with {connection.name}'),
            connection_id=data['connection_id'],
            provider=data.get('provider', 'ollama'),
            model_name=data.get('model_name', 'llama3.1:8b')
        )
        
        db.session.add(chat)
        db.session.commit()
        
        # Add initial greeting message
        greeting = Message(
            chat_id=chat.id,
            role='assistant',
            content="Hello! I'm a MySQL assistant. Ask me anything about your database."
        )
        db.session.add(greeting)
        db.session.commit()
        
        # Set as current chat in session
        session['current_chat_id'] = chat.id
        
        return jsonify({
            'success': True, 
            'id': chat.id,
            'chat': chat.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@chats_bp.route('/chats/<int:id>', methods=['GET'])
def get_chat(id):
    """Get a single chat."""
    chat = Chat.query.get_or_404(id)
    return jsonify({
        'success': True,
        'chat': chat.to_dict()
    })


@chats_bp.route('/chats/<int:id>', methods=['PUT'])
def update_chat(id):
    """Update a chat."""
    chat = Chat.query.get_or_404(id)
    data = request.json
    
    try:
        chat.title = data.get('title', chat.title)
        db.session.commit()
        return jsonify({
            'success': True,
            'chat': chat.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@chats_bp.route('/chats/<int:id>', methods=['DELETE'])
def delete_chat(id):
    """Soft delete a chat."""
    chat = Chat.query.get_or_404(id)
    
    try:
        chat.is_active = False
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@chats_bp.route('/chats/<int:id>/messages', methods=['GET'])
def get_chat_messages(id):
    """Get all messages for a chat."""
    chat = Chat.query.get_or_404(id)
    
    return jsonify({
        'success': True,
        'messages': [m.to_dict() for m in chat.messages]
    })


@chats_bp.route('/chats/<int:id>/messages', methods=['POST'])
def add_message(id):
    """Add a message to a chat."""
    chat = Chat.query.get_or_404(id)
    data = request.json
    
    try:
        message = Message(
            chat_id=id,
            role=data['role'],
            content=data['content'],
            sql_query=data.get('sql_query'),
            sql_results=data.get('sql_results')
        )
        
        db.session.add(message)
        
        # Update chat's updated_at
        chat.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'id': message.id,
            'message': message.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@chats_bp.route('/chats/<int:id>/send', methods=['POST'])
def send_message_to_chat(id):
    """Send a message and get AI response with persistence."""
    from services.engine import process_user_query
    
    chat = Chat.query.get_or_404(id)
    data = request.json
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'success': False, 'error': 'Message is required'}), 400
    
    # Connect to the chat's database
    connection = chat.connection
    
    try:
        db_manager.connect(
            user=connection.username,
            password=decrypt_password(connection.password),
            host=connection.host,
            port=str(connection.port),
            database=connection.database_name
        )
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': f'Failed to connect to database: {str(e)}'
        }), 400
    
    # Get chat history from database
    chat_history = [{'role': m.role, 'content': m.content} for m in chat.messages]
    
    # Save user message
    user_msg = Message(
        chat_id=id,
        role='user',
        content=message
    )
    db.session.add(user_msg)
    db.session.commit()
    
    # Process the query
    result = process_user_query(
        question=message,
        chat_history=chat_history,
        provider=chat.provider,
        model_name=chat.model_name,
        api_key=data.get('api_key')
    )
    
    # Handle response
    if result['type'] == 'error':
        # Save error as AI response
        ai_msg = Message(
            chat_id=id,
            role='assistant',
            content=result['content'],
            sql_query=result.get('sql')
        )
        db.session.add(ai_msg)
        db.session.commit()
        
        return jsonify({
            'success': False,
            'error': result['content'],
            'type': 'error',
            'message': result['content']
        }), 500
    
    elif result['type'] == 'casual':
        # Casual conversation response
        ai_msg = Message(
            chat_id=id,
            role='assistant',
            content=result['content']
        )
        db.session.add(ai_msg)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'type': 'casual',
            'message': result['content'],
            'message_id': ai_msg.id
        })
    
    else:  # type == 'sql'
        # SQL query response
        ai_msg = Message(
            chat_id=id,
            role='assistant',
            content=result['content'],
            sql_query=result.get('sql'),
            sql_results=result.get('sql_results')
        )
        db.session.add(ai_msg)
        
        # Update chat's updated_at
        chat.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'type': 'sql',
            'message': result['content'],
            'sql': result.get('sql'),
            'sql_results': result.get('sql_results'),
            'message_id': ai_msg.id
        })
