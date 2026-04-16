import os
import requests
import streamlit as st
from langchain_community.utilities import sql_database
from langchain_core.messages import AIMessage, HumanMessage

# Try to import google.generativeai, but don't fail if not available
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

#from dotenv import load_dotenv # when you are using it locally uncomment the import

#load_dotenv() # when you are using it locally uncomment this line

# Ollama configuration
OLLAMA_URL = "http://localhost:11434/api/chat"

def get_ollama_models():
    """Get list of available Ollama models"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            return [m["name"] for m in models]
    except:
        pass
    return ["llama3.1:8b", "gemma3", "deepseek-r1:14b"]

def query_ollama(model, messages, temperature=0.2):
    """Query Ollama API with messages"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {"temperature": temperature}
            },
            timeout=120
        )
        if response.status_code == 200:
            return response.json().get("message", {}).get("content", "")
        else:
            return f"Error: Ollama returned status {response.status_code}"
    except requests.exceptions.ConnectionError:
        return "Error: Cannot connect to Ollama. Make sure Ollama is running on localhost:11434"
    except Exception as e:
        return f"Error querying Ollama: {str(e)}"

# -----------------------------------------------------------------------------------------------------------------------

st.set_page_config(page_title="Chat with MySQL", page_icon=":speech_ballon:") # streamlit page configuration 

st.title("Chat with MySQL")


# Initializing chat history. Useful in context understanding of LLMs 

if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
         AIMessage(content="Hello! I'm a MySQL assistant. Ask me anything about your database.")
    ]

# Function: connects the database to the app using mysql-connector. Input given from sidebar
def init_database(user:str, password:str, host:str, port:str, database:str) -> sql_database.SQLDatabase:
    db_uri = f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}"
    return sql_database.SQLDatabase.from_uri(db_uri)

# Function: Generates the sql query using selected LLM provider
def get_sql(schema, chat_history, question, provider="ollama", model_name="llama3.1:8b", api_key=None):
    template = f"""You are a data analyst at a company. You are interacting with a user who is asking you questions about the company's database.
Based on the table schema below, write a SQL query that would answer the user's question. Take the conversation history into account.

<SCHEMA>{schema}</SCHEMA>

Conversation History: {chat_history}

Write only the SQL query and nothing else. Do not wrap the SQL query in any other text, not even backticks.

For example:
Question: which 3 artists have the most tracks?
SQL Query: SELECT ArtistId, COUNT(*) as track_count FROM Track GROUP BY ArtistId ORDER BY track_count DESC LIMIT 3;
Question: Name 10 artists
SQL Query: SELECT Name FROM Artist LIMIT 10;

Your turn:

Question: {question}
SQL Query:"""

    if provider == "ollama":
        messages = [{"role": "user", "content": template}]
        return query_ollama(model_name, messages, temperature=0.2)
    
    elif provider == "gemini" and GENAI_AVAILABLE:
        try:
            genai.configure(api_key=api_key or st.secrets.get("GEMINI_API_KEY_ID_1", ""))
            generation_config = {"temperature": 0.2, "top_p": 1, "top_k": 1, "max_output_tokens": 3000}
            model = genai.GenerativeModel(model_name="gemini-1.0-pro", generation_config=generation_config)
            response = model.generate_content(template)
            return response.text if response.text else "no response generated"
        except Exception as e:
            return f"An error occurred with Gemini: {str(e)}"
    
    return "Error: No valid LLM provider configured"

# Function: Generates the Natural Language response using selected LLM provider
def get_response(schema, chat_history, question, sql_result, sql_response_data, provider="ollama", model_name="llama3.1:8b", api_key=None):
    template = f"""You are a data analyst at a company. You are interacting with a user who is asking you questions about the company's database.
Based on the table schema below, question, sql query, and sql response, write a natural language response. Take the conversation history into account.

<SCHEMA>{schema}</SCHEMA>

Conversation History: {chat_history}
User question: {question}
SQL Query: <SQL>{sql_result}</SQL>
SQL Response: {sql_response_data}

Provide a clear, natural language answer to the user's question based on the SQL results."""

    if provider == "ollama":
        messages = [{"role": "user", "content": template}]
        return query_ollama(model_name, messages, temperature=0.2)
    
    elif provider == "gemini" and GENAI_AVAILABLE:
        try:
            genai.configure(api_key=api_key or st.secrets.get("GEMINI_API_KEY_ID_1", ""))
            generation_config = {"temperature": 0.2, "top_p": 1, "top_k": 1, "max_output_tokens": 3000}
            model = genai.GenerativeModel(model_name="gemini-1.0-pro", generation_config=generation_config)
            result = model.generate_content(template)
            return result.text if result.text else "no response generated"
        except Exception as e:
            return f"An error occurred with Gemini: {str(e)}"
    
    return "Error: No valid LLM provider configured"

#Sidebar: Takes input required to connect the MySQL Database and LLM Provider
with st.sidebar:
    st.subheader("Settings")
    st.write("This is a simple chat application using MySQL. Connect to the database and start chatting.")
    
    # LLM Provider Selection
    st.divider()
    st.subheader("LLM Provider")
    
    provider_options = ["ollama"]
    if GENAI_AVAILABLE:
        provider_options.append("gemini")
    
    selected_provider = st.selectbox(
        "Select LLM Provider",
        options=provider_options,
        format_func=lambda x: "Ollama (Local)" if x == "ollama" else "Google Gemini (API)"
    )
    st.session_state.provider = selected_provider
    
    if selected_provider == "ollama":
        ollama_models = get_ollama_models()
        selected_model = st.selectbox("Select Ollama Model", options=ollama_models, index=0 if ollama_models else None)
        st.session_state.model_name = selected_model
        st.info("Make sure Ollama is running on localhost:11434")
    else:
        st.session_state.model_name = "gemini-1.0-pro"
        gemini_key = st.text_input("Gemini API Key", type="password", help="Enter your Gemini API key")
        st.session_state.gemini_api_key = gemini_key
    
    st.divider()
    st.subheader("Database Connection")

    st.text_input("Host", help="Name of Host", key="Host")
    st.text_input("Port", help="Port Number", key="Port")
    st.text_input("User", help="Name of user", key="User")
    st.text_input("Password", type="password", help="Information is removed after every session", key="Password")
    st.text_input("Database", help="Name of the Database", key="Database")

    if st.button("Connect"):
        try:
            with st.spinner("Connecting to database..."):
                db=init_database(
                    st.session_state["User"],
                    st.session_state["Password"],
                    st.session_state["Host"],
                    st.session_state["Port"],
                    st.session_state["Database"]
                )
                st.session_state.db = db
                st.success("Connected to database!")
        except Exception as e:
            st.warning(e)

#chat: Forms the chat-like interface
for message in st.session_state.chat_history:
    if isinstance(message, AIMessage):
        with st.chat_message("AI"):
            st.markdown(message.content)
    elif isinstance(message, HumanMessage):
        with st.chat_message("Human"):
            st.markdown(message.content)

#User: Futher actions on user-query in chat-like interface. Place where input from user and output from the assistant takes place in natural language 
user_query = st.chat_input("Type a message...")
if user_query is not None and user_query.strip() != "":
    st.session_state.chat_history.append(HumanMessage(content=user_query))

    with st.chat_message("Human"):
        st.markdown(user_query)

    with st.chat_message("AI"):
        # Get provider settings from session state
        provider = st.session_state.get("provider", "ollama")
        model_name = st.session_state.get("model_name", "llama3.1:8b")
        api_key = st.session_state.get("gemini_api_key", None)
        
        # Show which provider is being used
        st.caption(f"Using: {provider} ({model_name})")
        
        sql_result = get_sql(
            st.session_state.db.get_table_info(), 
            st.session_state.chat_history, 
            user_query,
            provider=provider,
            model_name=model_name,
            api_key=api_key
        )
        
        # Check if SQL generation returned an error
        if sql_result.startswith("Error:"):
            st.error(sql_result)
            st.session_state.chat_history.append(AIMessage(content=sql_result))
        else:
            try:
                # Execute SQL query
                sql_response_data = st.session_state.db.run(sql_result)
                
                # Generate natural language response
                response = get_response(
                    st.session_state.db.get_table_info(), 
                    st.session_state.chat_history, 
                    user_query, 
                    sql_result, 
                    sql_response_data,
                    provider=provider,
                    model_name=model_name,
                    api_key=api_key
                )
                
                st.markdown(response)
                st.caption(f"SQL: {sql_result}")
                st.session_state.chat_history.append(AIMessage(content=response))
            except Exception as e:
                st.warning("I am Sorry. It looks like I made some mistake while trying to form logic or execute the correct logic. Please Try Again. I will try my best")
                st.warning(f"Error: {str(e)}")
                st.warning("Tip: Either Check the Prompt or Try to Improve it.")



