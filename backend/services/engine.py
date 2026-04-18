"""
Engine module for core business logic.
Handles SQL generation, casual question detection, and response generation.
"""

import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.messages import AIMessage, HumanMessage

from services.llm import llm_manager
from services.database import db_manager
from config import Config
from business_context import BUSINESS_RULES, BUSINESS_RELATIONSHIPS, TABLE_GLOSSARY, TIME_ANALYSIS_QUERIES, PRODUCT_SEARCH_RULES

# Configuration
MAX_CHAT_HISTORY = Config.MAX_CHAT_HISTORY
SCHEMA_MAX_LENGTH = 8000

# Casual question patterns — conversational only, NOT business
CASUAL_PATTERNS = [
    'hola', 'hello', 'hi', 'hey', 'buenos dias', 'buenas tardes', 'buenas noches',
    'como estas', 'how are you', 'que haces', 'what are you doing',
    'gracias', 'thank', 'adios', 'bye', 'goodbye', 'nos vemos',
    'quien eres', 'who are you', 'que eres', 'what are you',
    'como te llamas', 'what is your name', 'cual es tu nombre',
    'que puedes hacer', 'what can you do',
]

# Business keywords — if any of these appear, NEVER treat as casual
BUSINESS_KEYWORDS = [
    'venta', 'ventas', 'pedido', 'pedidos', 'factura', 'facturas',
    'tabla', 'tablas', 'item', 'items', 'producto', 'productos',
    'cliente', 'clientes', 'empleado', 'empleados', 'turno', 'turnos',
    'total', 'totales', 'monto', 'montos', 'ingreso', 'ingresos',
    'cuanto', 'cu\u00e1nto', 'cuantos', 'cu\u00e1ntos', 'cuantas', 'cu\u00e1ntas',
    'dime', 'dame', 'busca', 'muestra', 'lista', 'listar', 'mostrar',
    'consulta', 'precio', 'precios', 'cantidad', 'cantidades',
    'almacen', 'almacenes', 'sucursal', 'sucursales', 'caja', 'cajas',
    'ayer', 'hoy', 'semana', 'mes', 'a\u00f1o', 'dia', 'fecha',
    'top', 'ranking', 'mejor', 'mayor', 'menor', 'promedio',
    'sanduche', 'sandwich', 'pollo', 'combo', 'ba\u00f1ada',
]


def is_casual_question(question: str) -> bool:
    """
    Detect if the question is casual/conversational rather than a database query.
    Business keywords always override casual pattern matches.
    """
    question_lower = question.lower().strip()
    # If ANY business keyword is present, it's NOT casual
    if any(bk in question_lower for bk in BUSINESS_KEYWORDS):
        return False
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
    template = f"""Eres un asistente de base de datos MySQL amigable que trabaja para una empresa en Bolivia.
El usuario te dijo: "{question}"

IMPORTANTE: SIEMPRE responde en español. Nunca uses inglés.
Responde de forma cálida y natural. Si es un saludo, preséntate brevemente como asistente de base de datos
y ofrece ayuda. Máximo 2-3 oraciones."""

    messages = [{"role": "user", "content": template}]
    return llm_manager.query(provider, model_name, messages, temperature=0.7, api_key=api_key)


def generate_sql(schema: str, chat_history: List[Any], question: str,
                 provider: str = "ollama", model_name: str = "llama3.1:8b",
                 api_key: Optional[str] = None) -> str:
    """
    Generate SQL query from natural language question.
    Injects business context, current date, and DB name into the prompt.
    """
    # Check if it's a casual question
    if is_casual_question(question):
        return "__CASUAL__"

    # Optimize context size
    optimized_schema = truncate_schema(schema)
    limited_history = limit_chat_history(chat_history)

    # Date and DB context
    today     = datetime.now().strftime('%Y-%m-%d')
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    db_name   = (db_manager.connection_info or {}).get('database', 'pv_mchicken')

    template = f"""You are an expert SQL analyst for a restaurant and point-of-sale system in Bolivia.

=== CURRENT CONTEXT ===
Database name : {db_name}
Today's date  : {today}
Yesterday     : {yesterday}

<SCHEMA>
{optimized_schema}
</SCHEMA>

{BUSINESS_RULES}

{BUSINESS_RELATIONSHIPS}

{TABLE_GLOSSARY}

{TIME_ANALYSIS_QUERIES}

{PRODUCT_SEARCH_RULES}

Conversation History: {limited_history}

=== STRICT INSTRUCTIONS ===
1. Use ONLY table names and column names that appear in <SCHEMA>. NEVER invent column names.
2. Apply ALL business rules above in every query that involves sales or products.
3. For SHOW TABLES queries use:
   SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '{db_name}';
4. Write ONLY the raw SQL query. No explanations, no markdown, no backticks.
5. If unsure about a column name, use SELECT * FROM <table> LIMIT 1 to explore first.

Examples:
Question: How many customers do we have?
SQL Query: SELECT COUNT(cliente_id) FROM clientes;
Question: Top 3 products sold today
SQL Query: SELECT TRIM(REPLACE(i.descripcion,'(PLL)','')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS vendidos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id=lp.pedido_id JOIN items i ON lp.item_id=i.item_id WHERE DATE(p.fecha)='{today}' AND p.estado!='ANULADO' GROUP BY producto ORDER BY vendidos DESC LIMIT 3;

Question: {question}
SQL Query:"""

    messages = [{"role": "user", "content": template}]
    return llm_manager.query(provider, model_name, messages, temperature=0.1, api_key=api_key)


def generate_response(schema: str, chat_history: List[Any], question: str,
                      sql_query: str, sql_results: str,
                      provider: str = "ollama", model_name: str = "llama3.1:8b",
                      api_key: Optional[str] = None) -> str:
    """
    Generate natural language response from SQL results.
    """
    optimized_schema = truncate_schema(schema)
    limited_history = limit_chat_history(chat_history)
    db_name = (db_manager.connection_info or {}).get('database', 'pv_mchicken')

    template = f"""You are a friendly data analyst assistant for a restaurant/POS system in Bolivia.
Answer the user's question in Spanish using the SQL results below. Be concise and clear.

Database: {db_name}

<SCHEMA>{optimized_schema}</SCHEMA>

Conversation History: {limited_history}
User question: {question}
SQL Query: <SQL>{sql_query}</SQL>
SQL Response: {sql_results}

Provide a clear, natural language answer in Spanish based on the SQL results.
IMPORTANT: ALWAYS respond in Spanish. Never use English under any circumstance.
If results are empty, say so clearly in Spanish."""

    messages = [{"role": "user", "content": template}]
    return llm_manager.query(provider, model_name, messages, temperature=0.2, api_key=api_key)


def fix_sql_error(schema: str, question: str, failed_sql: str, error_msg: str,
                  provider: str, model_name: str, api_key: Optional[str] = None) -> str:
    """
    Ask the LLM to correct a SQL query that produced an error.
    Used as a single automatic retry in process_user_query().
    """
    db_name = (db_manager.connection_info or {}).get('database', 'pv_mchicken')
    optimized_schema = truncate_schema(schema)

    template = f"""A SQL query failed. Fix it using ONLY columns that exist in the schema below.

Database: {db_name}
<SCHEMA>{optimized_schema}</SCHEMA>

Original question: {question}

Failed SQL:
{failed_sql}

Error received:
{error_msg}

Write ONLY the corrected SQL query. No explanations, no backticks.
Corrected SQL:"""

    messages = [{"role": "user", "content": template}]
    return llm_manager.query(provider, model_name, messages, temperature=0.0, api_key=api_key)


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
    Process a user query through the complete RAG pipeline.
    Includes automatic SQL self-correction on first failure.
    """
    # Get schema from database (filtered to relevant tables)
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

    # Execute SQL — with one automatic self-correction retry on failure
    try:
        sql_results = db_manager.execute_query(sql_result)
    except Exception as e:
        print(f"[Engine] SQL failed, attempting self-correction. Error: {e}")
        corrected_sql = fix_sql_error(
            schema, question, sql_result, str(e),
            provider, model_name, api_key
        )
        is_valid_retry, _ = validate_sql(corrected_sql)
        if is_valid_retry:
            try:
                sql_results = db_manager.execute_query(corrected_sql)
                sql_result = corrected_sql  # Use corrected SQL in the final response
                print(f"[Engine] Self-correction succeeded.")
            except Exception as e2:
                return {
                    'type': 'error',
                    'content': f"Error executing SQL: {str(e2)}",
                    'sql': corrected_sql,
                    'error': str(e2)
                }
        else:
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
