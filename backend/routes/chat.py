"""
Chat routes for Flask backend.
Handles chat messages, history, and processing.
"""

from flask import Blueprint, request, jsonify, session
from services.engine import process_user_query, is_casual_question
from services.database import db_manager

chat_bp = Blueprint('chat', __name__)


def get_chat_history():
    """Get chat history from session."""
    return session.get('chat_history', [])


def add_to_history(role, content):
    """Add a message to chat history."""
    history = get_chat_history()
    history.append({'role': role, 'content': content})
    session['chat_history'] = history


@chat_bp.route('/history', methods=['GET'])
def get_history():
    """
    Get chat history.
    
    Returns:
        JSON with chat history
    """
    history = get_chat_history()
    
    # If no history, add initial greeting
    if not history:
        greeting = {
            'role': 'assistant',
            'content': "¡Hola! Soy Mama Chicken IA 🐔. Tu asistente inteligente de análisis de datos. ¿En qué puedo ayudarte hoy?"
        }
        history = [greeting]
        session['chat_history'] = history
    
    return jsonify({
        'success': True,
        'history': history
    })


@chat_bp.route('/message', methods=['POST'])
def send_message():
    """
    Send a chat message and get response.
    
    Request Body:
        - message: User's message
        - provider: LLM provider (default: 'ollama')
        - model_name: Model name (default: 'llama3.1:8b')
        - api_key: API key for cloud providers (optional)
    
    Returns:
        JSON with response and optional SQL info
    """
    # Check if database is connected
    if not db_manager.is_connected:
        return jsonify({
            'success': False,
            'error': 'Please connect to a database first'
        }), 400
    
    data = request.json
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({
            'success': False,
            'error': 'Message is required'
        }), 400
    
    provider = data.get('provider', 'ollama')
    model_name = data.get('model_name', 'llama3.1:8b')
    api_key = data.get('api_key')
    
    # Get chat history
    chat_history = get_chat_history()
    
    # Add user message to history
    add_to_history('user', message)
    
    # Process the query
    result = process_user_query(
        question=message,
        chat_history=chat_history,
        provider=provider,
        model_name=model_name,
        api_key=api_key
    )
    
    # Handle different response types
    if result['type'] == 'error':
        # Still add error to history for context
        add_to_history('assistant', result['content'])
        
        response = {
            'success': False,
            'error': result['content'],
            'type': 'error'
        }
        
        if 'sql' in result:
            response['sql'] = result['sql']
        
        return jsonify(response), 500
    
    elif result['type'] == 'casual':
        # Casual conversation response
        add_to_history('assistant', result['content'])
        
        return jsonify({
            'success': True,
            'type': 'casual',
            'message': result['content']
        })
    
    else:  # type == 'sql'
        # SQL query response
        add_to_history('assistant', result['content'])
        
        return jsonify({
            'success': True,
            'type': 'sql',
            'message': result['content'],
            'sql': result.get('sql'),
            'sql_results': result.get('sql_results')
        })


@chat_bp.route('/clear', methods=['POST'])
def clear_history():
    """
    Clear chat history.
    
    Returns:
        JSON with success status
    """
    session['chat_history'] = []
    
    # Add initial greeting back
    greeting = {
        'role': 'assistant',
        'content': "¡Hola! Soy Mama Chicken IA 🐔. Tu asistente inteligente de análisis de datos. ¿En qué puedo ayudarte hoy?"
    }
    session['chat_history'] = [greeting]
    
    return jsonify({
        'success': True,
        'message': 'Chat history cleared'
    })


@chat_bp.route('/check-casual', methods=['POST'])
def check_casual():
    """
    Check if a message is a casual question.
    
    Request Body:
        - message: Message to check
    
    Returns:
        JSON with casual status
    """
    data = request.json
    message = data.get('message', '')
    
    is_casual = is_casual_question(message)
    
    return jsonify({
        'success': True,
        'is_casual': is_casual
    })
