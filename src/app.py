"""
Chat with MySQL - Streamlit Application

A natural language interface for MySQL databases using local or cloud LLMs.
This module contains only the Streamlit UI logic. Business logic is in separate modules.
"""

import streamlit as st
from langchain_core.messages import AIMessage, HumanMessage

# Import from modular architecture
from database import db_manager, init_database
from models import llm_manager, get_ollama_models, is_gemini_available
from engine import (
    is_casual_question,
    get_casual_response,
    generate_sql,
    generate_response,
    truncate_schema,
    limit_chat_history
)

# =============================================================================
# PAGE CONFIGURATION
# =============================================================================

st.set_page_config(
    page_title="Chat with MySQL",
    page_icon=":speech_balloon:"
)

st.title("Chat with MySQL")


# =============================================================================
# SESSION STATE INITIALIZATION
# =============================================================================

if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        AIMessage(content="Hello! I'm a MySQL assistant. Ask me anything about your database.")
    ]

if "db_connected" not in st.session_state:
    st.session_state.db_connected = False


# =============================================================================
# SIDEBAR - SETTINGS & CONNECTION
# =============================================================================

with st.sidebar:
    st.subheader("Settings")
    st.write("Connect to your MySQL database and start chatting.")
    
    # LLM Provider Selection
    st.divider()
    st.subheader("LLM Provider")
    
    provider_options = ["ollama"]
    if is_gemini_available():
        provider_options.append("gemini")
    
    selected_provider = st.selectbox(
        "Select LLM Provider",
        options=provider_options,
        format_func=lambda x: "Ollama (Local)" if x == "ollama" else "Google Gemini (API)"
    )
    st.session_state.provider = selected_provider
    
    if selected_provider == "ollama":
        ollama_models = get_ollama_models()
        selected_model = st.selectbox(
            "Select Ollama Model",
            options=ollama_models,
            index=0 if ollama_models else None
        )
        st.session_state.model_name = selected_model
        st.info("Make sure Ollama is running on localhost:11434")
    else:
        st.session_state.model_name = "gemini-1.0-pro"
        gemini_key = st.text_input(
            "Gemini API Key",
            type="password",
            help="Enter your Gemini API key"
        )
        st.session_state.gemini_api_key = gemini_key
    
    # Database Connection
    st.divider()
    st.subheader("Database Connection")
    
    st.text_input("Host", help="Database host (e.g., localhost)", key="Host")
    st.text_input("Port", help="Database port (e.g., 3306)", key="Port")
    st.text_input("User", help="Database username", key="User")
    st.text_input(
        "Password",
        type="password",
        help="Database password",
        key="Password"
    )
    st.text_input("Database", help="Database name", key="Database")
    
    if st.button("Connect"):
        try:
            with st.spinner("Connecting to database..."):
                init_database(
                    st.session_state["User"],
                    st.session_state["Password"],
                    st.session_state["Host"],
                    st.session_state["Port"],
                    st.session_state["Database"]
                )
                st.session_state.db_connected = True
                st.success("Connected to database!")
        except Exception as e:
            st.error(f"Connection failed: {e}")


# =============================================================================
# CHAT INTERFACE
# =============================================================================

# Display chat history
for message in st.session_state.chat_history:
    if isinstance(message, AIMessage):
        with st.chat_message("AI"):
            st.markdown(message.content)
    elif isinstance(message, HumanMessage):
        with st.chat_message("Human"):
            st.markdown(message.content)


# =============================================================================
# USER INPUT HANDLING
# =============================================================================

user_query = st.chat_input("Type a message...")

if user_query is not None and user_query.strip() != "":
    # Check if database is connected
    if not st.session_state.db_connected:
        st.error("Please connect to a database first using the sidebar.")
    else:
        # Add user message to history
        st.session_state.chat_history.append(HumanMessage(content=user_query))
        
        # Display user message
        with st.chat_message("Human"):
            st.markdown(user_query)
        
        # Process with AI
        with st.chat_message("AI"):
            provider = st.session_state.get("provider", "ollama")
            model_name = st.session_state.get("model_name", "llama3.1:8b")
            api_key = st.session_state.get("gemini_api_key", None)
            
            # Show provider info
            st.caption(f"Using: {provider} ({model_name})")
            
            # Warning for large models
            if any(x in model_name.lower() for x in ["14b", "32b", "70b"]):
                st.info(f"⏳ Large model detected ({model_name}). This may take 30-60 seconds...")
            
            # Get schema (cached)
            try:
                with st.spinner("📊 Analyzing database schema..."):
                    schema = db_manager.get_schema(use_cache=True)
            except Exception as e:
                st.error(f"Error getting schema: {e}")
                st.stop()
            
            # Check if casual question
            if is_casual_question(user_query):
                with st.spinner("💬 Responding..."):
                    response = get_casual_response(
                        user_query, provider, model_name, api_key
                    )
                st.markdown(response)
                st.session_state.chat_history.append(AIMessage(content=response))
            
            else:
                # Generate SQL
                with st.spinner("🤖 Generating SQL query..."):
                    sql_result = generate_sql(
                        schema,
                        st.session_state.chat_history,
                        user_query,
                        provider=provider,
                        model_name=model_name,
                        api_key=api_key
                    )
                
                # Handle SQL generation errors
                if sql_result.startswith("Error:"):
                    st.error(f"❌ {sql_result}")
                    st.info("💡 Check if Ollama is running or try a different model.")
                    st.session_state.chat_history.append(AIMessage(content=sql_result))
                
                else:
                    # Execute SQL
                    try:
                        with st.spinner("⚡ Executing SQL query..."):
                            sql_response_data = db_manager.execute_query(sql_result)
                        
                        # Generate natural language response
                        with st.spinner("💬 Generating response..."):
                            response = generate_response(
                                schema,
                                st.session_state.chat_history,
                                user_query,
                                sql_result,
                                sql_response_data,
                                provider=provider,
                                model_name=model_name,
                                api_key=api_key
                            )
                        
                        st.markdown(response)
                        with st.expander("🔍 View SQL Query"):
                            st.code(sql_result, language="sql")
                        
                        st.session_state.chat_history.append(AIMessage(content=response))
                    
                    except Exception as e:
                        st.error("❌ Error executing query")
                        st.error(f"Details: {str(e)}")
                        st.info("💡 Check your SQL syntax or try rephrasing your question.")
