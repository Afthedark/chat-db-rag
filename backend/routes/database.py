"""
Database routes for Flask backend.
Handles database connection, schema retrieval, and query execution.
"""

from flask import Blueprint, request, jsonify, session
from services.database import db_manager

database_bp = Blueprint('database', __name__)


@database_bp.route('/connect', methods=['POST'])
def connect():
    """
    Connect to MySQL database.
    
    Request Body:
        - host: Database host
        - port: Database port
        - user: Database username
        - password: Database password
        - database: Database name
    
    Returns:
        JSON with success status and message
    """
    data = request.json
    
    required_fields = ['host', 'port', 'user', 'password', 'database']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    try:
        db_manager.connect(
            user=data['user'],
            password=data['password'],
            host=data['host'],
            port=str(data['port']),
            database=data['database']
        )
        
        # Store connection info in session (without password)
        session['db_connected'] = True
        session['db_info'] = {
            'host': data['host'],
            'port': data['port'],
            'user': data['user'],
            'database': data['database']
        }
        
        return jsonify({
            'success': True,
            'message': 'Connected to database successfully',
            'database': data['database']
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Connection failed: {str(e)}'
        }), 500


@database_bp.route('/test', methods=['POST'])
def test_connection():
    """
    Test database connection without storing it.
    
    Request Body:
        - host: Database host
        - port: Database port
        - user: Database username
        - password: Database password
        - database: Database name
    
    Returns:
        JSON with success status
    """
    data = request.json
    
    required_fields = ['host', 'port', 'user', 'password', 'database']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    try:
        success = db_manager.test_connection(
            user=data['user'],
            password=data['password'],
            host=data['host'],
            port=str(data['port']),
            database=data['database']
        )
        
        if success:
            return jsonify({'success': True, 'message': 'Connection successful'})
        else:
            return jsonify({'success': False, 'error': 'Connection failed'}), 400
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@database_bp.route('/schema', methods=['GET'])
def get_schema():
    """
    Get database schema.
    
    Returns:
        JSON with schema string
    """
    if not db_manager.is_connected:
        return jsonify({'success': False, 'error': 'No database connection'}), 400
    
    try:
        schema = db_manager.get_schema(use_cache=True)
        return jsonify({
            'success': True,
            'schema': schema
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@database_bp.route('/query', methods=['POST'])
def execute_query():
    """
    Execute a SQL query.
    
    Request Body:
        - sql: SQL query to execute
    
    Returns:
        JSON with query results
    """
    if not db_manager.is_connected:
        return jsonify({'success': False, 'error': 'No database connection'}), 400
    
    data = request.json
    sql = data.get('sql')
    
    if not sql:
        return jsonify({'success': False, 'error': 'No SQL query provided'}), 400
    
    try:
        results = db_manager.execute_query(sql)
        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@database_bp.route('/status', methods=['GET'])
def get_status():
    """
    Get database connection status.
    
    Returns:
        JSON with connection status and info
    """
    connected = db_manager.is_connected
    
    response = {
        'success': True,
        'connected': connected
    }
    
    if connected and db_manager.connection_info:
        response['info'] = db_manager.connection_info
    
    return jsonify(response)


@database_bp.route('/disconnect', methods=['POST'])
def disconnect():
    """
    Disconnect from database.
    
    Returns:
        JSON with success status
    """
    global db_manager
    from services.database import DatabaseManager
    
    # Reset the singleton instance
    db_manager = DatabaseManager()
    
    session.pop('db_connected', None)
    session.pop('db_info', None)
    
    return jsonify({'success': True, 'message': 'Disconnected from database'})
