"""
Models routes for Flask backend.
Handles LLM provider and model listing.
"""

from flask import Blueprint, request, jsonify
from services.llm import llm_manager, get_ollama_models

models_bp = Blueprint('models', __name__)


@models_bp.route('/providers', methods=['GET'])
def get_providers():
    """
    Get list of available LLM providers.
    
    Returns:
        JSON with list of providers
    """
    providers = llm_manager.get_available_providers()
    
    # Format providers for frontend
    formatted_providers = []
    for provider in providers:
        if provider == 'ollama':
            formatted_providers.append({
                'id': 'ollama',
                'name': 'Ollama (Local)',
                'description': 'Use local models like Llama, Gemma, DeepSeek'
            })
    
    return jsonify({
        'success': True,
        'providers': formatted_providers
    })


@models_bp.route('/ollama', methods=['GET'])
def get_ollama_models_list():
    """
    Get list of available Ollama models.
    
    Returns:
        JSON with list of model names
    """
    try:
        models = get_ollama_models()
        return jsonify({
            'success': True,
            'models': models
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@models_bp.route('/<provider>', methods=['GET'])
def get_models_for_provider(provider):
    """
    Get available models for a specific provider.
    
    Args:
        provider: Provider name ('ollama')
    
    Returns:
        JSON with list of models
    """
    try:
        models = llm_manager.get_available_models(provider)
        
        # Format models for frontend
        formatted_models = []
        for model in models:
            formatted_models.append({
                'id': model,
                'name': model
            })
        
        return jsonify({
            'success': True,
            'models': formatted_models
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
