"""
Engine module for core business logic.
Handles SQL generation, casual question detection, and response generation.
"""

import os
import re
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.messages import AIMessage, HumanMessage

from models import llm_manager
from database import db_manager

# Configuration
MAX_CHAT_HISTORY = int(os.getenv("MAX_CHAT_HISTORY", "3"))
SCHEMA_MAX_LENGTH = 4000

# Casual question patterns
CASUAL_PATTERNS = [
    'hola', 'hello', 'hi', 'hey', 'buenos dias', 'buenas tardes', 'buenas noches',
    'como estas', 'how are you', 'que tal', 'que haces', 'what are you doing',
    'gracias', 'thank', 'adios', 'bye', 'goodbye', 'nos vemos',
    'quien eres', 'who are you', 'que eres', 'what are you',
    'como te llamas', 'what is your name', 'cual es tu nombre',
    'que puedes hacer', 'what can you do', 'ayuda', 'help'
]


def is_casual_question(question: str) -> bool:
    """
    Detect if the question is casual/conversational rather than a database query.
    
    Args:
        question: User's input question
        
    Returns:
        True if question is casual/conversational
    """
    question_lower = question.lower().strip()
    return any(pattern in question_lower for pattern in CASUAL_PATTERNS)


def truncate_schema(schema: str, max_length: int = SCHEMA_MAX_LENGTH) -> str:
    """
    Truncate schema if it exceeds max length to reduce tokens.
    
    Args:
        schema: Database schema string
        max_length: Maximum length before truncation
        
    Returns:
        Truncated schema if needed
    """
    if len(schema) <= max_length:
        return schema
    return schema[:max_length] + "\n... [schema truncated due to length]"


def limit_chat_history(chat_history: List[Any], max_messages: int = MAX_CHAT_HISTORY) -> List[Any]:
    """
    Limit chat history to last N messages to reduce context size.
    
    Args:
        chat_history: Full chat history
        max_messages: Maximum number of messages to keep
        
    Returns:
        Limited chat history
    """
    if len(chat_history) <= max_messages:
        return chat_history
    return chat_history[-max_messages:]


def get_casual_response(question: str, provider: str = "ollama", 
                        model_name: str = "llama3.1:8b", api_key: Optional[str] = None) -> str:
    """
    Generate a casual/conversational response.
    
    Args:
        question: User's casual question
        provider: LLM provider to use
        model_name: Model name to use
        api_key: API key for cloud providers
        
    Returns:
        Casual response text
    """
    template = f"""You are a friendly MySQL database assistant. The user just said: "{question}"
    
Respond in a warm, conversational way. Introduce yourself briefly as a database assistant and offer to help with their database questions.
Keep your response short (2-3 sentences max) and friendly.

IMPORTANT: Always respond in Spanish (español)."""

    messages = [{"role": "user", "content": template}]
    return llm_manager.query(provider, model_name, messages, temperature=0.7, api_key=api_key)


def generate_sql(schema: str, chat_history: List[Any], question: str,
                 provider: str = "ollama", model_name: str = "llama3.1:8b", 
                 api_key: Optional[str] = None) -> str:
    """
    Generate SQL query from natural language question.
    
    Args:
        schema: Database schema
        chat_history: Chat history for context
        question: User's question
        provider: LLM provider
        model_name: Model name
        api_key: API key for cloud providers
        
    Returns:
        Generated SQL query or "__CASUAL__" if casual question
    """
    # Check if it's a casual question
    if is_casual_question(question):
        return "__CASUAL__"
    
    # Optimize context size
    optimized_schema = truncate_schema(schema)
    limited_history = limit_chat_history(chat_history)
    
    template = f"""You are a data analyst at a company. You are interacting with a user who is asking you questions about the company's database.
Based on the table schema below, write a SQL query that would answer the user's question. Take the conversation history into account.

<SCHEMA>{optimized_schema}</SCHEMA>

Conversation History: {limited_history}

Write only the SQL query and nothing else. Do not wrap the SQL query in any other text, not even backticks.

For example:
Question: which 3 artists have the most tracks?
SQL Query: SELECT ArtistId, COUNT(*) as track_count FROM Track GROUP BY ArtistId ORDER BY track_count DESC LIMIT 3;
Question: Name 10 artists
SQL Query: SELECT Name FROM Artist LIMIT 10;

Your turn:

Question: {question}
SQL Query:"""

    messages = [{"role": "user", "content": template}]
    return llm_manager.query(provider, model_name, messages, temperature=0.2, api_key=api_key)


def generate_response(schema: str, chat_history: List[Any], question: str,
                      sql_query: str, sql_results: str,
                      provider: str = "ollama", model_name: str = "llama3.1:8b",
                      api_key: Optional[str] = None) -> str:
    """
    Generate natural language response from SQL results.
    
    Args:
        schema: Database schema
        chat_history: Chat history for context
        question: Original user question
        sql_query: Executed SQL query
        sql_results: Results from SQL execution
        provider: LLM provider
        model_name: Model name
        api_key: API key for cloud providers
        
    Returns:
        Natural language response
    """
    # Optimize context size
    optimized_schema = truncate_schema(schema)
    limited_history = limit_chat_history(chat_history)
    
    template = f"""You are a data analyst at a company. You are interacting with a user who is asking you questions about the company's database.
Based on the table schema below, question, sql query, and sql response, write a natural language response. Take the conversation history into account.

<SCHEMA>{optimized_schema}</SCHEMA>

Conversation History: {limited_history}
User question: {question}
SQL Query: <SQL>{sql_query}</SQL>
SQL Response: {sql_results}

Provide a clear, natural language answer to the user's question based on the SQL results.

IMPORTANT: Always respond in Spanish (español)."""

    messages = [{"role": "user", "content": template}]
    return llm_manager.query(provider, model_name, messages, temperature=0.2, api_key=api_key)


def validate_sql(sql: str) -> Tuple[bool, Optional[str]]:
    """
    Basic SQL validation.
    
    Args:
        sql: SQL query to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check for empty SQL
    if not sql or not sql.strip():
        return False, "Empty SQL query"
    
    # Check for basic SQL keywords
    sql_upper = sql.upper().strip()
    
    # Must start with SELECT, INSERT, UPDATE, DELETE (for safety)
    allowed_starts = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'SHOW', 'DESCRIBE', 'EXPLAIN']
    if not any(sql_upper.startswith(keyword) for keyword in allowed_starts):
        return False, f"SQL must start with one of: {', '.join(allowed_starts)}"
    
    # Basic syntax checks
    open_parens = sql.count('(')
    close_parens = sql.count(')')
    if open_parens != close_parens:
        return False, "Unbalanced parentheses"
    
    # Check for dangerous operations (basic check)
    dangerous = ['DROP TABLE', 'DROP DATABASE', 'TRUNCATE TABLE']
    for danger in dangerous:
        if danger in sql_upper:
            return False, f"Dangerous operation detected: {danger}"
    
    return True, None


def process_user_query(question: str, chat_history: List[Any],
                       provider: str = "ollama", model_name: str = "llama3.1:8b",
                       api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Process a user query through the complete pipeline.
    
    Args:
        question: User's question
        chat_history: Chat history
        provider: LLM provider
        model_name: Model name
        api_key: API key for cloud providers
        
    Returns:
        Dict with response details:
        {
            'type': 'casual' | 'sql' | 'error',
            'content': response text,
            'sql': SQL query (if applicable),
            'sql_results': SQL results (if applicable),
            'error': error message (if applicable)
        }
    """
    # Get schema from database
    try:
        schema = db_manager.get_schema(use_cache=True)
    except ValueError as e:
        return {
            'type': 'error',
            'content': str(e),
            'error': 'No database connection'
        }
    
    # Generate SQL or detect casual question
    sql_result = generate_sql(schema, chat_history, question, provider, model_name, api_key)
    
    # Handle casual question
    if sql_result == "__CASUAL__":
        casual_response = get_casual_response(question, provider, model_name, api_key)
        return {
            'type': 'casual',
            'content': casual_response
        }
    
    # Handle SQL generation error
    if sql_result.startswith("Error:"):
        return {
            'type': 'error',
            'content': sql_result,
            'error': sql_result
        }
    
    # Validate SQL
    is_valid, error_msg = validate_sql(sql_result)
    if not is_valid:
        return {
            'type': 'error',
            'content': f"Invalid SQL generated: {error_msg}",
            'sql': sql_result,
            'error': error_msg
        }
    
    # Execute SQL
    try:
        sql_results = db_manager.execute_query(sql_result)
    except Exception as e:
        return {
            'type': 'error',
            'content': f"Error executing SQL: {str(e)}",
            'sql': sql_result,
            'error': str(e)
        }
    
    # Generate natural language response
    response = generate_response(
        schema, chat_history, question, sql_result, sql_results,
        provider, model_name, api_key
    )
    
    return {
        'type': 'sql',
        'content': response,
        'sql': sql_result,
        'sql_results': sql_results
    }


# Backward compatibility aliases
get_sql = generate_sql
get_response = generate_response
