# Chat-With-MySQL

Asistente de MySQL con persistencia: Accede a la información de tus bases de datos usando lenguaje natural. Guarda múltiples conexiones y chats con historial persistente.

<hr>

## Tabla de Contenidos
1. [¿Qué hace?](#qué-hace)
2. [Características](#características)
3. [Arquitectura](#arquitectura)
4. [Requisitos](#requisitos)
5. [Instalación](#instalación)
6. [Configuración](#configuración)
7. [Uso](#uso)
8. [Estructura del Proyecto](#estructura-del-proyecto)

<hr>

## ¿Qué hace?

Este asistente revoluciona la interacción con bases de datos MySQL permitiendo hacer consultas en lenguaje natural. Ahora con **persistencia completa**: guarda múltiples conexiones a bases de datos y mantén un historial de chats persistente.

**Ejemplo:**
- **Pregunta:** "¿Cuántos clientes tenemos en Madrid?"
- **Respuesta:** "Tienes 45 clientes en Madrid."
- **SQL usado:** `SELECT COUNT(*) FROM clientes WHERE ciudad = 'Madrid';`

<hr>

## Características

### 🧠 Soporte Dual de LLM
- **Ollama (Local):** Usa modelos locales como Llama, Gemma, DeepSeek - ¡sin costos de API!
- **Google Gemini (API):** Usa la API de Google para respuestas avanzadas

### 💾 Persistencia Completa
- **Múltiples Conexiones:** Guarda y gestiona múltiples conexiones a bases de datos
- **Chats Persistentes:** Crea chats vinculados a conexiones específicas con historial guardado
- **Contraseñas Seguras:** Encriptación de contraseñas con Fernet

### 🗣️ Respuestas en Español
La IA responde siempre en español, independientemente de cómo formules tu pregunta. Ideal para equipos hispanohablantes.

### 🎨 Interfaz Moderna
- Diseño con Bootstrap 5
- Sidebar con gestión de conexiones y chats
- Selector de modelos con todos tus modelos locales
- Soporte para múltiples proveedores (Ollama/Gemini) por chat

### 🔒 Privacidad
Con Ollama, todos los datos permanecen en tu computadora. Nada se envía a la nube.

<hr>

## Arquitectura

```
┌─────────────────┐      HTTP/JSON       ┌─────────────────────────────────┐
│  Frontend       │ ◄──────────────────► │  Backend Flask                  │
│  (Vanilla JS    │                      │                                 │
│   + Bootstrap 5)│                      │  ┌─────────────────────────┐    │
└─────────────────┘                      │  │  SQLAlchemy ORM         │    │
                                         │  │  - UserConnection       │    │
                                         │  │  - Chat                 │    │
                                         │  │  - Message              │    │
                                         │  └─────────────────────────┘    │
                                         │           │                     │
                                         │           ▼                     │
                                         │  ┌─────────────────────────┐    │
                                         │  │  Base de datos del      │    │
                                         │  │  proyecto (MySQL)       │    │
                                         │  │  - Persistencia         │    │
                                         │  └─────────────────────────┘    │
                                         │                                 │
                                         │  ┌─────────────────────────┐    │
                                         │  │  Bases de datos del     │    │
                                         │  │  usuario (MySQL)        │    │
                                         │  │  - Consultas SQL        │    │
                                         │  └─────────────────────────┘    │
                                         └─────────────────────────────────┘
```

<hr>

## Requisitos

### Software necesario:
- Python 3.11, 3.12, 3.13 o 3.14
- MySQL Server (para la persistencia del proyecto)
- MySQL Server(s) (bases de datos a consultar)
- Ollama (opcional, para usar modelos locales)
- API Key de Google Gemini (opcional, para usar Gemini)

### Bases de datos:
1. **Base de datos del proyecto** (`chat_db_rag`): Almacena conexiones, chats y mensajes
2. **Bases de datos del usuario**: Las que quieras consultar con lenguaje natural

<hr>

## Instalación

### 1. Clonar o descargar el proyecto

```
chat-db-rag/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── src/                    (código original Streamlit - legacy)
├── .env                    (configuración global)
└── README.md
```

### 2. Crear entorno virtual

```powershell
# Crear entorno virtual
python -m venv env

# Activar entorno (Windows)
env\Scripts\activate
```

### 3. Instalar dependencias del backend

```powershell
cd backend
pip install -r requirements.txt
```

### 4. Crear base de datos de persistencia

```sql
CREATE DATABASE chat_db_rag;
```

### 5. Configurar Ollama (opcional, para modelos locales)

Descarga e instala Ollama desde [ollama.com](https://ollama.com)

Descarga modelos que quieras usar:
```powershell
ollama pull llama3.2:3b
ollama pull phi4-mini-reasoning:3.8b
ollama pull deepseek-r1:14b
ollama pull qwen3.5:9b
ollama pull llama3.1:8b
ollama pull gemma4:e4b
```

**Modelos disponibles en tu instalación:**
| Modelo | Tamaño | Descripción |
|--------|--------|-------------|
| `llama3.2:3b` | 2.0 GB | Rápido y ligero |
| `phi4-mini-reasoning:3.8b` | 3.2 GB | Razonamiento optimizado |
| `deepseek-r1:14b` | 9.0 GB | Excelente para SQL complejo |
| `qwen3.5:9b` | 6.6 GB | Buen balance calidad/velocidad |
| `llama3.1:8b` | 4.9 GB | Versátil y confiable |
| `gemma4:e4b` | 9.6 GB | Modelo Google actualizado |

<hr>

## Configuración

### Backend (.env)

Crea el archivo `backend/.env`:

```env
# -----------------------------------------------------------------------------
# PROJECT DATABASE (MySQL for persistence)
# This is the project's own database to store connections, chats, and messages
# -----------------------------------------------------------------------------

# Option 1: Use separate variables (recommended - more readable)
DB_DRIVER=mysql+mysqlconnector
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_db_rag

# Option 2: Use direct URL (alternative)
# Uncomment the line below if you prefer using a direct URL
# DATABASE_URL=mysql+mysqlconnector://root:@localhost:3306/chat_db_rag

# -----------------------------------------------------------------------------
# ENCRYPTION KEY (for password encryption)
# Generate a new key with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# IMPORTANT: Keep this key secure and don't change it after data is stored!
# -----------------------------------------------------------------------------
ENCRYPTION_KEY=tu-clave-generada-aqui

# -----------------------------------------------------------------------------
# FLASK CONFIGURATION
# -----------------------------------------------------------------------------
SECRET_KEY=tu-clave-secreta-flask
FLASK_DEBUG=True
FLASK_PORT=5000

# -----------------------------------------------------------------------------
# OLLAMA PERFORMANCE CONFIGURATION
# -----------------------------------------------------------------------------
OLLAMA_TIMEOUT=120
OLLAMA_MAX_RETRIES=3
OLLAMA_RETRY_DELAY=2
OLLAMA_CONTEXT_LIMIT=4096
MAX_CHAT_HISTORY=3

# -----------------------------------------------------------------------------
# GOOGLE GEMINI API (optional)
# -----------------------------------------------------------------------------
GEMINI_API_KEY_ID_1=

# -----------------------------------------------------------------------------
# CORS CONFIGURATION
# -----------------------------------------------------------------------------
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend

No requiere configuración. El frontend se conecta automáticamente al backend en `http://localhost:5000`.

<hr>

## Uso

### 1. Iniciar Ollama (si usas modelos locales)

```powershell
ollama serve
```

### 2. Iniciar el backend

```powershell
cd backend
python app.py
```

El backend se iniciará en `http://localhost:5000` y creará automáticamente las tablas necesarias.

### 3. Iniciar el frontend

En otra terminal:

```powershell
cd frontend
python -m http.server 3000
```

Abre tu navegador en `http://localhost:3000`

### 4. Usar la aplicación

#### Paso 1: Agregar una conexión
1. Haz clic en **"Add Connection"**
2. Completa los datos:
   - **Name:** Nombre descriptivo (ej: "Producción", "Desarrollo")
   - **Host:** localhost o IP del servidor
   - **Port:** 3306 (por defecto)
   - **Username:** Usuario MySQL
   - **Password:** Contraseña MySQL
   - **Database:** Nombre de la base de datos
3. Haz clic en **"Save Connection"**

#### Paso 2: Crear un chat
1. Haz clic en **"New Chat"**
2. Selecciona una conexión guardada
3. Opcional: Pon un título al chat
4. Selecciona el proveedor de LLM (Ollama o Gemini)
5. Haz clic en **"Create Chat"**

#### Paso 3: Chatear
- Escribe preguntas en lenguaje natural
- El historial se guarda automáticamente
- Puedes ver el SQL generado haciendo clic en "View SQL Query"

### Ejemplos de preguntas:
- "¿Cuántos registros tenemos en total?"
- "Muéstrame los 5 productos más vendidos"
- "¿Quién es el cliente que más ha comprado?"
- "Lista todas las órdenes del mes pasado"
- "¿Cuál es el promedio de ventas por mes?"

<hr>

## Estructura del Proyecto

### Backend (`backend/`)

```
backend/
├── app.py                  # Punto de entrada Flask
├── config.py              # Configuración
├── requirements.txt       # Dependencias
├── .env                   # Variables de entorno
├── models/
│   ├── __init__.py
│   └── database.py        # Modelos SQLAlchemy
├── routes/
│   ├── chat.py            # Endpoints de chat
│   ├── chats.py           # Gestión de chats persistentes
│   ├── connections.py     # CRUD de conexiones
│   ├── database.py        # Conexión a BD del usuario
│   └── models.py          # Proveedores LLM
└── services/
    ├── database.py        # Gestión de conexiones MySQL
    ├── engine.py          # Lógica de generación SQL
    ├── encryption.py      # Encriptación de contraseñas
    └── llm.py             # Clientes Ollama/Gemini
```

### Frontend (`frontend/`)

```
frontend/
├── index.html             # Página principal
├── css/
│   └── styles.css         # Estilos personalizados
└── js/
    ├── api.js             # Cliente API (Axios)
    ├── app.js             # Inicialización
    ├── chat.js            # UI del chat
    ├── chats.js           # Gestión de chats
    ├── connections.js     # Gestión de conexiones
    └── database.js        # Conexión a BD (legacy)
```

<hr>

## API Endpoints

### Conexiones
- `GET /api/connections` - Listar conexiones guardadas
- `POST /api/connections` - Crear nueva conexión
- `GET /api/connections/{id}` - Obtener conexión
- `PUT /api/connections/{id}` - Actualizar conexión
- `DELETE /api/connections/{id}` - Eliminar conexión
- `POST /api/connections/{id}/test` - Probar conexión
- `POST /api/connections/{id}/connect` - Conectar

### Chats
- `GET /api/chats` - Listar chats
- `POST /api/chats` - Crear chat
- `GET /api/chats/{id}` - Obtener chat
- `PUT /api/chats/{id}` - Actualizar chat
- `DELETE /api/chats/{id}` - Eliminar chat
- `GET /api/chats/{id}/messages` - Obtener mensajes
- `POST /api/chats/{id}/send` - Enviar mensaje

<hr>

## Notas de Seguridad

1. **ENCRYPTION_KEY:** Nunca cambies esta clave después de haber guardado contraseñas. Si la cambias, no podrás descifrar las contraseñas existentes.

2. **SECRET_KEY:** Usa una clave fuerte y única en producción.

3. **FLASK_DEBUG:** Desactívalo (`False`) en producción.

4. **CORS_ORIGINS:** Restringe los orígenes permitidos en producción.

<hr>

## Solución de Problemas

### Error: "No module named 'flask_sqlalchemy'"
```powershell
pip install flask-sqlalchemy
```

### Error: "Unknown database 'chat_db_rag'"
Crea la base de datos:
```sql
CREATE DATABASE chat_db_rag;
```

### Error: "Cannot connect to Ollama"
Asegúrate de que Ollama esté corriendo:
```powershell
ollama serve
```

### Error: "No se cargan los modelos en el selector"
El frontend usa una lista de respaldo con todos tus modelos locales. Si la API de Ollama no responde, se mostrarán los modelos predefinidos.

### Error: "La IA responde en inglés"
Verifica que el archivo `src/engine.py` tenga los prompts con la instrucción "IMPORTANT: Always respond in Spanish". Si modificaste el archivo, reinicia el backend.

<hr>

**Desarrollado con:** Flask + SQLAlchemy + Vanilla JS + Bootstrap 5
