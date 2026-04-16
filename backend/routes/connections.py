"""
Connections routes for Flask backend.
Handles saved database connections CRUD operations.
"""

from flask import Blueprint, request, jsonify, session
from models.database import db, UserConnection
from services.encryption import encrypt_password, decrypt_password
from services.database import db_manager

connections_bp = Blueprint('connections', __name__)


@connections_bp.route('/connections', methods=['GET'])
def list_connections():
    """List all saved database connections."""
    connections = UserConnection.query.filter_by(is_active=True).all()
    return jsonify({
        'success': True,
        'connections': [c.to_dict() for c in connections]
    })


@connections_bp.route('/connections', methods=['POST'])
def create_connection():
    """Save a new database connection."""
    data = request.json
    
    # Validate required fields (password can be empty)
    required_fields = ['name', 'host', 'username', 'database_name']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    # Password is optional (can be empty string)
    password = data.get('password', '')
    
    try:
        connection = UserConnection(
            name=data['name'],
            host=data['host'],
            port=data.get('port', 3306),
            username=data['username'],
            password=encrypt_password(password),
            database_name=data['database_name']
        )
        
        db.session.add(connection)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'id': connection.id,
            'connection': connection.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@connections_bp.route('/connections/<int:id>', methods=['GET'])
def get_connection(id):
    """Get a single connection."""
    connection = UserConnection.query.get_or_404(id)
    return jsonify({
        'success': True,
        'connection': connection.to_dict()
    })


@connections_bp.route('/connections/<int:id>', methods=['PUT'])
def update_connection(id):
    """Update a connection."""
    connection = UserConnection.query.get_or_404(id)
    data = request.json
    
    try:
        connection.name = data.get('name', connection.name)
        connection.host = data.get('host', connection.host)
        connection.port = data.get('port', connection.port)
        connection.username = data.get('username', connection.username)
        if 'password' in data and data['password']:
            connection.password = encrypt_password(data['password'])
        connection.database_name = data.get('database_name', connection.database_name)
        
        db.session.commit()
        return jsonify({
            'success': True,
            'connection': connection.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@connections_bp.route('/connections/<int:id>', methods=['DELETE'])
def delete_connection(id):
    """Soft delete a connection."""
    connection = UserConnection.query.get_or_404(id)
    
    try:
        connection.is_active = False
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@connections_bp.route('/connections/<int:id>/test', methods=['POST'])
def test_saved_connection(id):
    """Test a saved connection."""
    connection = UserConnection.query.get_or_404(id)
    
    try:
        success = db_manager.test_connection(
            user=connection.username,
            password=decrypt_password(connection.password),
            host=connection.host,
            port=str(connection.port),
            database=connection.database_name
        )
        
        if success:
            return jsonify({'success': True, 'message': 'Connection successful'})
        else:
            return jsonify({'success': False, 'error': 'Connection failed'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@connections_bp.route('/connections/<int:id>/connect', methods=['POST'])
def connect_to_saved(id):
    """Connect to a saved database."""
    connection = UserConnection.query.get_or_404(id)
    
    try:
        db_manager.connect(
            user=connection.username,
            password=decrypt_password(connection.password),
            host=connection.host,
            port=str(connection.port),
            database=connection.database_name
        )
        
        # Store current connection in session
        session['current_connection_id'] = connection.id
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400
