"""
Chat-DB-RAG: Natural Language to SQL Assistant

A Streamlit-based application that allows users to query MySQL databases
using natural language, powered by local LLMs (Ollama) or cloud LLMs (Gemini).
"""

__version__ = "1.0.0"
__author__ = "Chat-DB-RAG Team"

# Database exports
from database import (
    DatabaseManager,
    db_manager,
    init_database,
    get_cached_schema,
    execute_query
)

# Model exports
from models import (
    OllamaClient,
    GeminiClient,
    LLMManager,
    llm_manager,
    get_ollama_models,
    query_ollama,
    is_gemini_available
)

# Engine exports
from engine import (
    is_casual_question,
    truncate_schema,
    limit_chat_history,
    get_casual_response,
    generate_sql,
    generate_response,
    validate_sql,
    process_user_query,
    get_sql,  # backward compatibility
    get_response  # backward compatibility
)

__all__ = [
    # Version
    "__version__",
    
    # Database
    "DatabaseManager",
    "db_manager",
    "init_database",
    "get_cached_schema",
    "execute_query",
    
    # Models
    "OllamaClient",
    "GeminiClient",
    "LLMManager",
    "llm_manager",
    "get_ollama_models",
    "query_ollama",
    "is_gemini_available",
    
    # Engine
    "is_casual_question",
    "truncate_schema",
    "limit_chat_history",
    "get_casual_response",
    "generate_sql",
    "generate_response",
    "validate_sql",
    "process_user_query",
    "get_sql",
    "get_response"
]
