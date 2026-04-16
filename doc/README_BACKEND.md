# README — Backend Técnico

API REST en Flask que implementa un sistema RAG (Retrieval-Augmented Generation) para
consultar bases de datos MySQL en lenguaje natural, usando modelos LLM locales (Ollama)
o en la nube (Google Gemini).

---

## Tabla de Contenidos

1. [Estructura de archivos](#1-estructura-de-archivos)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [app.py — Punto de entrada](#3-apppy--punto-de-entrada)
4. [config.py — Configuración central](#4-configpy--configuración-central)
5. [Modelos SQLAlchemy](#5-modelos-sqlalchemy)
6. [Rutas API (Blueprints)](#6-rutas-api-blueprints)
7. [Services — Capa de lógica de negocio](#7-services--capa-de-lógica-de-negocio)
8. [business_context.py](#8-business_contextpy)
9. [Referencia completa de endpoints](#9-referencia-completa-de-endpoints)
10. [Seguridad](#10-seguridad)
11. [Dependencias](#11-dependencias)

---

## 1. Estructura de archivos

```
backend/
│
├── app.py                    # Punto de entrada Flask, registro de blueprints
├── config.py                 # Clase Config — lee variables del .env
├── business_context.py       # Reglas de negocio inyectadas en el prompt LLM
├── requirements.txt          # Dependencias Python
├── .env                      # Variables de entorno (NO subir a git)
├── .env.example              # Plantilla pública del .env
│
├── models/
│   ├── __init__.py
│   └── database.py           # Modelos SQLAlchemy: UserConnection, Chat, Message
│
├── routes/
│   ├── __init__.py
│   ├── chats.py              # CRUD de chats + endpoint principal /send
│   ├── connections.py        # CRUD de conexiones de BD guardadas
│   ├── database.py           # Estado y control de la conexión activa
│   ├── models.py             # Lista de modelos Ollama disponibles
│   └── chat.py               # Ruta legacy de chat sin persistencia
│
└── services/
    ├── engine.py             # Orquestador RAG: genera SQL, ejecuta, responde
    ├── llm.py                # Clientes Ollama y Gemini API
    ├── database.py           # Gestión de conexión a la BD de usuario
    └── encryption.py         # Encriptación/desencriptación de contraseñas
```

---

## 2. Stack tecnológico

| Componente | Librería | Uso |
|---|---|---|
| Web framework | `Flask 3.x` | API REST, blueprints, sesiones |
| ORM | `Flask-SQLAlchemy 3.x` | Persistencia de chats/conexiones |
| CORS | `flask-cors` | Permite peticiones del frontend |
| Sesiones | `flask-session` | Sesiones del servidor (filesystem) |
| SQL RAG | `langchain-community` | `SQLDatabase` para schema y queries |
| LLM local | `requests` | Llamadas HTTP a Ollama API |
| LLM cloud | `google-genai >= 1.0.0` | SDK oficial Google Gemini |
| MySQL driver | `mysql-connector-python` | Conexión a MySQL/MariaDB |
| Seguridad | `cryptography (Fernet)` | Encriptación de contraseñas |
| Config | `python-dotenv` | Carga de variables desde `.env` |

---

## 3. `app.py` — Punto de entrada

Inicializa Flask, SQLAlchemy, CORS, sesiones y registra todos los blueprints.

```python
# Orden de inicialización:
1. Flask(__name__)
2. app.config.from_object(Config)
3. db.init_app(app)               # SQLAlchemy
4. db.create_all()                # Crea tablas si no existen
5. CORS(app, origins=...)         # Habilita CORS
6. Session(app)                   # Sesiones filesystem
7. app.register_blueprint(...)    # Registra las 5 rutas
```

### Blueprints registrados

| Blueprint | Prefijo | Archivo |
|---|---|---|
| `chat_bp` | `/api/chat` | `routes/chat.py` |
| `database_bp` | `/api/database` | `routes/database.py` |
| `models_bp` | `/api/models` | `routes/models.py` |
| `connections_bp` | `/api` | `routes/connections.py` |
| `chats_bp` | `/api` | `routes/chats.py` |

### Endpoints de sistema

```
GET /          → Info de la API (nombre, versión, endpoints disponibles)
GET /health    → Health check { "status": "healthy" }
```

---

## 4. `config.py` — Configuración central

Clase estática `Config` que lee todas las variables del `.env` mediante `os.getenv()`.

```python
class Config:
    SECRET_KEY             # Clave Flask para sesiones
    OLLAMA_URL             # URL del servidor Ollama (default: localhost:11434)
    OLLAMA_TIMEOUT         # Segundos hasta timeout (default: 120)
    OLLAMA_MAX_RETRIES     # Reintentos automáticos (default: 3)
    OLLAMA_RETRY_DELAY     # Segundos entre reintentos (default: 2)
    OLLAMA_CONTEXT_LIMIT   # Tokens de contexto num_ctx (default: 8192)
    MAX_CHAT_HISTORY       # Mensajes previos enviados al LLM (default: 5)
    GEMINI_API_KEY         # Clave de Google Gemini API
    CORS_ORIGINS           # Lista de orígenes permitidos
    SQLALCHEMY_DATABASE_URI # URL de conexión a BD de persistencia
    ENCRYPTION_KEY         # Clave Fernet para cifrado de contraseñas
```

> ⚠️ **Prioridad:** El `.env` siempre sobreescribe los valores por defecto de `config.py`.
> Si existe la variable en `.env`, `config.py` la toma de ahí.

### Construcción dinámica de `DATABASE_URL`

`Config.build_database_url()` construye la URL de SQLAlchemy a partir de variables
individuales (`DB_USER`, `DB_HOST`, `DB_PORT`, etc.) o acepta una `DATABASE_URL`
directa si está definida.

---

## 5. Modelos SQLAlchemy

Definidos en `models/database.py`. Son 3 modelos que representan la persistencia
**del propio sistema** (no la BD del usuario).

### `UserConnection`
Almacena las conexiones MySQL guardadas por el usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | Integer PK | ID autoincremental |
| `name` | String(100) | Nombre amigable de la conexión |
| `host` | String(255) | Host del servidor MySQL |
| `port` | Integer | Puerto (default 3306) |
| `username` | String(100) | Usuario de MySQL |
| `password` | String(255) | Contraseña **encriptada con Fernet** |
| `database_name` | String(100) | Nombre de la BD a consultar |
| `is_active` | Boolean | Soft delete flag |
| `created_at` | DateTime | Timestamp de creación |

Relación: `UserConnection` → `Chat` (1:N, cascade delete)

---

### `Chat`
Sesión de conversación ligada a una conexión.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | Integer PK | ID autoincremental |
| `title` | String(200) | Título del chat (editable) |
| `connection_id` | Integer FK | Referencia a `user_connections.id` |
| `provider` | String(50) | `'ollama'` o `'gemini'` |
| `model_name` | String(100) | Ej: `'llama3.1:8b'`, `'gemini-2.0-flash'` |
| `is_active` | Boolean | Soft delete flag |
| `updated_at` | DateTime | Se actualiza en cada mensaje |

Relación: `Chat` → `Message` (1:N, cascade delete, ordenado por `created_at`)

---

### `Message`
Mensaje individual dentro de un chat.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | Integer PK | ID autoincremental |
| `chat_id` | Integer FK | Referencia a `chats.id` |
| `role` | String(20) | `'user'` o `'assistant'` |
| `content` | Text | Texto del mensaje |
| `sql_query` | Text (nullable) | SQL generado (solo respuestas SQL) |
| `sql_results` | Text (nullable) | Resultados crudos del SQL |
| `created_at` | DateTime | Timestamp del mensaje |

---

## 6. Rutas API (Blueprints)

### `routes/chats.py` — El blueprint más importante

Gestiona el ciclo de vida completo de chats y mensajes.

#### `POST /api/chats` — Crear chat

```json
// Request body
{
  "connection_id": 1,
  "title": "Análisis de ventas",     // opcional
  "provider": "gemini",              // "ollama" | "gemini"
  "model_name": "gemini-2.0-flash"  // nombre del modelo
}

// Response
{
  "success": true,
  "id": 12,
  "chat": { ...chat_dict }
}
```

---

#### `POST /api/chats/<id>/send` — ⭐ Endpoint principal

Recibe el mensaje del usuario, ejecuta el pipeline RAG completo y guarda todo.

```json
// Request body
{
  "message": "¿Cuántos pedidos hubo ayer?",
  "api_key": "AIza..."   // opcional, solo para Gemini
}
```

**Flujo interno del endpoint:**
```
1. Obtener chat + conexión de BD desde SQLAlchemy
2. Conectar a la BD del usuario (db_manager.connect)
3. Leer historial de mensajes del chat
4. Guardar mensaje del usuario en BD
5. process_user_query(message, history, provider, model, api_key)
6. Evaluar type del resultado: 'casual' | 'sql' | 'error'
7. Guardar respuesta de la IA en BD (con sql_query y sql_results si aplica)
8. Retornar respuesta al frontend
```

**Respuestas posibles:**

```json
// type: "sql"
{
  "success": true,
  "type": "sql",
  "message": "Ayer hubo 142 pedidos...",
  "sql": "SELECT COUNT(*) FROM pedidos WHERE...",
  "sql_results": "[{'COUNT(*)': 142}]",
  "message_id": 45
}

// type: "casual"
{
  "success": true,
  "type": "casual",
  "message": "¡Hola! Soy tu asistente de base de datos...",
  "message_id": 46
}

// type: "error"
{
  "success": false,
  "type": "error",
  "message": "Error executing SQL: Unknown column 'ventas_total'...",
  "message_id": 47  // el error también se guarda en la BD
}
```

---

#### Otros endpoints de chats

```
GET    /api/chats              → Listar chats activos (ordenado por updated_at DESC)
GET    /api/chats/<id>         → Obtener un chat
PUT    /api/chats/<id>         → Actualizar título del chat
DELETE /api/chats/<id>         → Soft delete (is_active = False)
GET    /api/chats/<id>/messages → Todos los mensajes del chat
POST   /api/chats/<id>/messages → Agregar mensaje manualmente
```

---

### `routes/connections.py`

CRUD completo para conexiones de BD guardadas.

```
GET    /api/connections              → Listar conexiones
POST   /api/connections              → Crear conexión (encripta la contraseña)
GET    /api/connections/<id>         → Obtener conexión
PUT    /api/connections/<id>         → Actualizar conexión
DELETE /api/connections/<id>         → Eliminar conexión
POST   /api/connections/<id>/connect → Conectar a esa BD y cachear el schema
```

Al guardar una conexión, `encryption.py` encripta la contraseña con Fernet
antes de almacenarla en la BD de persistencia.

---

### `routes/database.py`

```
GET  /api/database/status  → Estado de la conexión activa (conectado/desconectado)
POST /api/database/connect → Conectar a BD (host, port, user, password, database)
POST /api/database/disconnect → Desconectar
GET  /api/database/schema  → Schema de la BD activa (tablas filtradas)
POST /api/database/query   → Ejecutar SQL directo
```

---

### `routes/models.py`

```
GET /api/models/ollama  → Lista de modelos instalados en el servidor Ollama local
```

Hace una petición HTTP a `http://localhost:11434/api/tags` y devuelve los modelos
disponibles para poblar el selector del frontend.

---

## 7. Services — Capa de lógica de negocio

### `services/engine.py` — El orquestador RAG

El archivo más crítico del sistema. Ver `README_IA.md` para el flujo detallado.

**Funciones públicas:**

```python
process_user_query(question, chat_history, provider, model_name, api_key)
# → Dict: { type, content, sql?, sql_results? }
```

**Funciones internas:**

```python
is_casual_question(question)     # Detecta saludos vs consultas de negocio
generate_sql(...)                # LLM call #1: pregunta → SQL
generate_response(...)           # LLM call #2: SQL + resultados → texto natural
fix_sql_error(...)               # LLM call de corrección si el SQL falla
get_casual_response(...)         # LLM call para conversación casual
validate_sql(sql)               # Validación básica antes de ejecutar
truncate_schema(schema)          # Limita el schema a SCHEMA_MAX_LENGTH chars
limit_chat_history(history)      # Limita el historial a MAX_CHAT_HISTORY msgs
```

**Constantes clave:**

```python
SCHEMA_MAX_LENGTH = 8000     # máx chars del schema enviados al LLM
MAX_CHAT_HISTORY  = 5        # últimos N mensajes enviados como contexto
CASUAL_PATTERNS   = [...]    # 14 patrones de conversación casual
BUSINESS_KEYWORDS = [...]    # 25 palabras que bloquean la detección casual
```

---

### `services/llm.py` — Los clientes LLM

Implementa dos clientes con la misma interfaz `.query()`:

#### `OllamaClient`

```python
def query(self, model, messages, temperature=0.2) -> str
```

Hace un `POST` a `http://localhost:11434/api/chat` con:
```json
{
  "model": "llama3.1:8b",
  "messages": [...],
  "stream": false,
  "options": {
    "temperature": 0.1,
    "num_ctx": 6144        // OLLAMA_CONTEXT_LIMIT del .env
  }
}
```

Sistema de retry: hasta 3 intentos con backoff exponencial (2s, 4s).

#### `GeminiClient`

```python
def query(self, model, messages, temperature=0.2, api_key=None) -> str
```

Usa `google.genai` SDK. Convierte el historial de mensajes al formato
`types.Content` de Google. Si se pasa `api_key` en el request, crea un
cliente temporal con esa clave (en vez de la del `.env`).

#### `LLMManager`

Singleton que expone:
```python
llm_manager.query(provider, model_name, messages, temperature, api_key)
# provider: "ollama" | "gemini"
```

---

### `services/database.py` — Gestión de conexión de usuario

Singleton `db_manager` que gestiona la conexión activa a la BD del usuario.

```python
db_manager.connect(user, password, host, port, database)
# Crea SQLDatabase de LangChain y guarda la info de conexión

db_manager.get_schema(use_cache=True)
# Devuelve schema filtrado (excluye EXCLUDED_TABLES de business_context.py)
# Con cache=True, la segunda consulta es instantánea (no va a MySQL)

db_manager.execute_query(sql)
# Ejecuta SQL en la BD del usuario y devuelve el resultado como string

db_manager.clear_schema_cache()
# Fuerza recarga del schema en la próxima llamada
```

**Filtrado de tablas:**
```python
all_tables      = db._db.get_usable_table_names()   # todas las tablas
relevant_tables = [t for t in all_tables if t not in EXCLUDED_TABLES]
# Solo las tablas de negocio van al LLM
```

---

### `services/encryption.py` — Cifrado de contraseñas

Usa `cryptography.fernet.Fernet` con la clave `ENCRYPTION_KEY` del `.env`.

```python
encrypt_password(plain_text)   # → str cifrado (se guarda en BD)
decrypt_password(cipher_text)  # → str plano (se usa para conectar)
```

> ⚠️ Si cambias `ENCRYPTION_KEY` después de guardar conexiones, las contraseñas
> existentes no se podrán desencriptar. Guarda la clave de forma segura.

---

## 8. `business_context.py`

Archivo de conocimiento del dominio `pv_mchicken`. Se importa en `engine.py`
y en `database.py`.

```python
EXCLUDED_TABLES   # Lista de ~38 tablas SIAT/fiscal a excluir del schema
BUSINESS_RULES    # 6 reglas SQL críticas (estados, cantidades, formato Bs, etc.)
BUSINESS_RELATIONSHIPS  # Mapa de JOINs correctos entre tablas
TABLE_GLOSSARY    # Glosario usuario → patrón LIKE SQL
```

Ver `README_IA.md` para descripción detallada de cada sección.

---

## 9. Referencia completa de endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Info API |
| `GET` | `/health` | Health check |
| `GET` | `/api/chats` | Listar chats activos |
| `POST` | `/api/chats` | Crear chat |
| `GET` | `/api/chats/<id>` | Obtener chat |
| `PUT` | `/api/chats/<id>` | Actualizar título |
| `DELETE` | `/api/chats/<id>` | Soft delete chat |
| `GET` | `/api/chats/<id>/messages` | Mensajes del chat |
| `POST` | `/api/chats/<id>/messages` | Agregar mensaje manual |
| **`POST`** | **`/api/chats/<id>/send`** | **⭐ Enviar mensaje al RAG** |
| `GET` | `/api/connections` | Listar conexiones |
| `POST` | `/api/connections` | Crear conexión |
| `GET` | `/api/connections/<id>` | Obtener conexión |
| `PUT` | `/api/connections/<id>` | Actualizar conexión |
| `DELETE` | `/api/connections/<id>` | Eliminar conexión |
| `POST` | `/api/connections/<id>/connect` | Activar conexión |
| `GET` | `/api/database/status` | Estado conexión activa |
| `POST` | `/api/database/connect` | Conectar a BD |
| `POST` | `/api/database/disconnect` | Desconectar |
| `GET` | `/api/database/schema` | Schema de la BD activa |
| `POST` | `/api/database/query` | Ejecutar SQL directo |
| `GET` | `/api/models/ollama` | Modelos Ollama instalados |

---

## 10. Seguridad

| Aspecto | Implementación |
|---|---|
| **Contraseñas BD** | Cifradas con Fernet antes de guardar en SQLite/MySQL |
| **API Keys Gemini** | Se aceptan por request (header) o desde el `.env` — nunca se loguean |
| **CORS** | Restringido a orígenes del `.env` (no `*`) |
| **Sesiones** | Servidor (filesystem), firmadas con `SECRET_KEY` |
| **SQL Injection** | LangChain `SQLDatabase` usa parámetros internamente; el SQL generado por el LLM se valida antes de ejecutar |
| **`.env`** | Nunca debe subirse a git — está en `.gitignore` |

---

## 11. Dependencias

```txt
flask>=3.0.0               # Framework web
flask-cors>=4.0.0          # CORS
flask-session>=0.5.0       # Sesiones de servidor
flask-sqlalchemy>=3.1.0    # ORM
langchain>=1.2.10          # Pipeline RAG (solo SQLDatabase)
langchain-community>=0.4.1 # SQLDatabase de LangChain
langchain-core>=1.2.11     # Tipos y mensajes base
mysql-connector-python>=9.6.0  # Driver MySQL para SQLAlchemy y directo
google-genai>=1.0.0        # SDK Gemini (nuevo, reemplaza google-generativeai)
python-dotenv>=1.0.0       # Carga de .env
requests>=2.31.0           # HTTP client para Ollama
numpy>=2.2.4               # Requerido por LangChain internamente
cryptography>=41.0.0       # Fernet para cifrado de contraseñas
```

### Actualizar dependencias

```bash
source env/bin/activate
pip install -r requirements.txt --upgrade
```

### Agregar nueva dependencia

```bash
pip install <paquete>
pip freeze | grep <paquete> >> requirements.txt
```

---

> Para detalles del sistema de IA, ver [`README_IA.md`](./README_IA.md)  
> Para instalación en Ubuntu, ver [`README_LINUX.md`](./README_LINUX.md)
