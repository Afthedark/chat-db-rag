# Backend - Chat DB RAG

API RESTful para el asistente empresarial de IA con arquitectura **Two-Pass RAG** que permite consultar bases de datos relacionales mediante lenguaje natural.

---

## 📋 Requisitos

- **Node.js** v18.x o superior (recomendado para usar `--watch`)
- **MySQL** Server (XAMPP, Standalone o Docker)
- **Ollama** (opcional, para IA local) o cuenta en **OpenRouter**

---

## 🚀 Instalación Rápida

### 1. Base de Datos de Memoria

Crea la base de datos donde se almacenará la configuración, historial de chats y reglas:

```sql
CREATE DATABASE ai_memory_db;
```

### 2. Configuración de Variables de Entorno

Copia el archivo `.env` y ajusta según tu entorno:

```bash
# Puerto del servidor
PORT=3000

# Proveedor de IA: 'ollama' o 'openrouter'
AI_PROVIDER=ollama

# Configuración OpenRouter (si AI_PROVIDER=openrouter)
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct

# Configuración Ollama (si AI_PROVIDER=ollama)
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=gemma4:e4b

# Base de datos de memoria (Sequelize)
MEM_DB_HOST=localhost
MEM_DB_PORT=3301
MEM_DB_USER=root
MEM_DB_PASS=
MEM_DB_NAME=ai_memory_db
```

### 3. Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar seed para crear reglas iniciales
npm run seed

# Modo desarrollo (auto-restart al cambiar archivos)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
/backend
├── config/
│   └── database.js          # Configuración Sequelize (MySQL)
├── controllers/
│   ├── chatController.js    # Lógica del chat Two-Pass RAG
│   ├── databaseController.js # CRUD de conexiones a BD
│   └── rulesController.js   # CRUD de reglas de contexto
├── middleware/
│   └── errorHandler.js      # Manejo centralizado de errores
├── models/
│   ├── index.js             # Exporta todos los modelos y relaciones
│   ├── Chat.js              # Modelo de conversaciones
│   ├── Message.js           # Modelo de mensajes
│   ├── DatabaseConnection.js # Modelo de conexiones a BD
│   └── ContextRule.js       # Modelo de reglas de contexto IA
├── routes/
│   ├── chatRoutes.js        # Rutas /api/chat
│   ├── databaseRoutes.js    # Rutas /api/databases
│   └── rulesRoutes.js       # Rutas /api/rules
├── seeds/
│   └── initialRules.js      # Seed de reglas iniciales
├── services/
│   ├── aiService.js         # Abstracción de proveedores IA
│   ├── sqlValidator.js      # Validador de seguridad SQL
│   ├── promptBuilder.js     # Constructor de prompts dinámicos
│   └── dbManager.js         # Gestión de pools de conexiones
├── .env                     # Variables de entorno
├── package.json
└── server.js                # Entry point de la aplicación
```

---

## 🔌 API Endpoints

### Chat RAG (`/api/chat`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/chat` | Enviar mensaje al asistente (Two-Pass RAG) |
| `GET` | `/api/chat` | Listar todas las conversaciones |
| `GET` | `/api/chat/:chatId/messages` | Obtener mensajes de una conversación |
| `DELETE` | `/api/chat/:chatId` | Eliminar una conversación |

**Ejemplo de petición POST:**
```json
{
  "question": "¿Cuántas ventas hubo hoy?",
  "targetDbId": 1,
  "historyId": null
}
```

### Bases de Datos (`/api/databases`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/databases` | Listar todas las conexiones |
| `POST` | `/api/databases` | Crear nueva conexión |
| `PUT` | `/api/databases/:id` | Actualizar conexión |
| `DELETE` | `/api/databases/:id` | Eliminar conexión |
| `POST` | `/api/databases/:id/test` | Probar conexión |

### Reglas de Contexto (`/api/rules`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/rules` | Listar reglas (filtrable por `?category=`) |
| `GET` | `/api/rules/:id` | Obtener regla específica |
| `POST` | `/api/rules` | Crear nueva regla |
| `PUT` | `/api/rules/:id` | Actualizar regla |
| `DELETE` | `/api/rules/:id` | Eliminar regla |

### Sistema (`/api/system`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/system/info` | Información del proveedor IA configurado |

---

## 🧠 Arquitectura Two-Pass RAG

El flujo de procesamiento de cada consulta sigue estos pasos:

```
┌─────────────────┐
│   Paso 0: Clasificación de Intención    │
│   (DATABASE vs GENERAL)                 │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
[GENERAL]  [DATABASE]
    │         │
    │    ┌────┴─────────────────────────────┐
    │    │   Paso 1: Generación SQL         │
    │    │   - Construye prompt con reglas  │
    │    │   - IA genera consulta SQL       │
    │    └────┬─────────────────────────────┘
    │         │
    │    ┌────┴─────────────────────────────┐
    │    │   Validación de Seguridad        │
    │    │   - Whitelist: SELECT/SHOW       │
    │    │   - Blacklist: INSERT/UPDATE/etc │
    │    └────┬─────────────────────────────┘
    │         │
    │    ┌────┴─────────────────────────────┐
    │    │   Ejecución en BD Objetivo       │
    │    │   - Pool de conexiones dinámico  │
    │    └────┬─────────────────────────────┘
    │         │
    │    ┌────┴─────────────────────────────┐
    └────┤   Paso 2: Interpretación         │
         │   - IA interpreta resultados     │
         │   - Respuesta conversacional     │
         └──────────────────────────────────┘
```

---

## 🛡️ Seguridad SQL

El sistema implementa múltiples capas de protección en [`sqlValidator.js`](services/sqlValidator.js):

### Whitelist de Comandos Permitidos
- ✅ `SELECT`
- ✅ `SHOW`
- ✅ `DESCRIBE`
- ✅ `WITH` (CTEs)

### Blacklist de Comandos Bloqueados
- ❌ `INSERT`, `UPDATE`, `DELETE`
- ❌ `DROP`, `ALTER`, `TRUNCATE`, `CREATE`
- ❌ `GRANT`, `REVOKE`, `EXEC`, `CALL`
- ❌ `INTO OUTFILE`, `INTO DUMPFILE`, `LOAD_FILE`

### Protecciones Adicionales
- **Anti-inyección**: Bloquea múltiples sentencias (`;` seguido de texto)
- **Auto-limit**: Agrega `LIMIT 1000` automáticamente a consultas SELECT sin límite
- **Limpieza de markdown**: Elimina backticks de código antes de validar

> **Recomendación**: Aunque el validador es robusto, se recomienda usar usuarios MySQL con privilegios **READ ONLY** para las conexiones objetivo.

---

## 🗄️ Modelos de Datos

### Chat
- `id` (PK)
- `title` (string, opcional)
- `databaseId` (integer, referencia a la BD usada)
- `createdAt`, `updatedAt`

### Message
- `id` (PK)
- `chatId` (FK)
- `role` (enum: 'user', 'assistant')
- `content` (text)
- `sqlExecuted` (text, opcional - SQL que se ejecutó)
- `databaseUsed` (string, opcional - nombre de la BD)
- `createdAt`

### DatabaseConnection
- `id` (PK)
- `name` (string, único)
- `host`, `port`, `user`, `password`, `database`
- `isActive` (boolean)
- `description` (text, opcional - para DDL/schema)

### ContextRule
- `id` (PK)
- `key` (string, único)
- `category` (enum: 'INSTRUCCIONES', 'EJEMPLOS_SQL')
- `content` (text)
- `isActive` (boolean)

---

## 🔧 Servicios Core

### aiService.js
Abstracción unificada para proveedores de IA:
- **OpenRouter**: Usa SDK oficial de OpenAI con baseURL apuntando a OpenRouter
- **Ollama**: Usa Axios para llamadas HTTP al servidor local

### promptBuilder.js
Construye prompts dinámicos según el contexto:
- `buildClassifierPrompt()`: Clasifica intención (DATABASE vs GENERAL)
- `buildSQLPrompt()`: Genera SQL con reglas y esquema de BD
- `buildBusinessPrompt()`: Interpreta resultados en lenguaje natural
- `buildGeneralChatPrompt()`: Respuestas conversacionales generales

### dbManager.js
Gestión de conexiones dinámicas:
- Mantiene pools de conexiones en memoria (Map)
- Crea pools bajo demanda
- Cierra conexiones graceful al terminar

---

## 📝 Scripts NPM

```bash
npm run dev      # Desarrollo con auto-restart (Node --watch)
npm start        # Producción
npm run seed     # Insertar reglas iniciales en la BD
```

---

## 🐛 Debugging

El servidor incluye logs en consola para:
- Intención detectada (Paso 0)
- Errores de ejecución SQL
- Errores de conexión a IA

En modo desarrollo (`NODE_ENV !== 'production'`), los errores incluyen el stack trace completo.

---

## 🔒 Buenas Prácticas de Seguridad

1. **Nunca commitear el archivo `.env`** (ya está en `.gitignore`)
2. Usar contraseñas fuertes para las conexiones MySQL
3. Crear usuarios MySQL dedicados con permisos mínimos (solo SELECT)
4. En producción, configurar `NODE_ENV=production`
5. Considerar implementar rate limiting para endpoints públicos
6. Usar HTTPS en producción (configurar reverse proxy con Nginx/Apache)

---

## 📚 Documentación Relacionada

- [Documentación Principal](../README.md)
- [Documentación Frontend](../frontend/README_FRONTEND.md)
- [Referencia Deep Chat](../frontend/deepchat.md)