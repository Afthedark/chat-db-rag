# Backend - Chat DB RAG

API RESTful para el asistente de IA conversacional con arquitectura RAG de dos pasos (Two-Pass RAG).

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│              (Navegador / Deep Chat Component)               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         EXPRESS.JS                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ /api/chat   │  │ /api/rules  │  │ /api/databases      │  │
│  │  Two-Pass   │  │    CRUD     │  │  Connection Pool    │  │
│  │    RAG      │  │   Rules     │  │    Management       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────┴────────────────┴─────────────────────┴──────────┐ │
│  │              SERVICES (Business Logic)                 │ │
│  │  ┌──────────┐  ┌─────────────┐  ┌──────────────────┐   │ │
│  │  │aiService │  │sqlValidator │  │  promptBuilder   │   │ │
│  │  │(OpenAI/  │  │  (Security) │  │  (Dynamic        │   │ │
│  │  │ Ollama)  │  │             │  │   Prompts)       │   │ │
│  │  └──────────┘  └─────────────┘  └──────────────────┘   │ │
│  │  ┌──────────┐  ┌─────────────┐                          │ │
│  │  │dbManager │  │  AppError   │                          │ │
│  │  │(mysql2)  │  │ (Errors)    │                          │ │
│  │  └──────────┘  └─────────────┘                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│         │                │                     │             │
│  ┌──────┴────────────────┴─────────────────────┴──────────┐ │
│  │                      MODELS (Sequelize)                │ │
│  │  ┌──────────┐  ┌─────────────┐  ┌──────────────┐       │ │
│  │  │   Chat   │  │   Message   │  │ ContextRule  │       │ │
│  │  │  (Hist)  │  │  (Content)  │  │(Prompts/DDL) │       │ │
│  │  └──────────┘  └─────────────┘  └──────────────┘       │ │
│  │  ┌──────────────────────────────────────────────┐       │ │
│  │  │         DatabaseConnection (Pools)           │       │ │
│  │  └──────────────────────────────────────────────┘       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                     ┌──────┴──────┐                          │
│                     │   MySQL     │                          │
│                     │ ai_memory_db│                          │
│                     └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de Carpetas

```
/backend
├── /config
│   └── database.js              # Configuración Sequelize
├── /controllers
│   ├── chatController.js        # Lógica Two-Pass RAG
│   ├── databaseController.js    # CRUD conexiones DB
│   └── rulesController.js       # CRUD reglas de contexto
├── /middleware
│   └── errorHandler.js          # Manejo centralizado de errores
├── /models
│   ├── Chat.js                  # Modelo historial de chats
│   ├── Message.js               # Modelo mensajes
│   ├── ContextRule.js           # Modelo reglas IA
│   ├── DatabaseConnection.js    # Modelo conexiones DB
│   └── index.js                 # Relaciones y exportación
├── /routes
│   ├── chatRoutes.js            # Rutas /api/chat
│   ├── databaseRoutes.js        # Rutas /api/databases
│   └── rulesRoutes.js           # Rutas /api/rules
├── /services
│   ├── aiService.js             # Integración OpenAI/Ollama
│   ├── dbManager.js             # Connection pooling mysql2
│   ├── promptBuilder.js         # Construcción dinámica de prompts
│   └── sqlValidator.js          # Validación y extracción de SQL
├── /seeds
│   └── initialRules.js          # Datos iniciales
├── .env                         # Variables de entorno
├── package.json
├── server.js                    # Entry point
└── README_BACKEND.md            # Este archivo
```

## Flujo Two-Pass RAG

```
Paso 0: Clasificación de Intención
─────────────────────────────────────
Usuario: "ventas de ayer"
   ↓
IA Clasificador: "DATABASE" | "GENERAL"
   ↓
Si GENERAL → Respuesta conversacional (fin)
Si DATABASE → Continuar al Paso 1

Paso 1: Generación de SQL
─────────────────────────
Prompt: "Genera SQL para: ventas de ayer"
   ↓
IA Genera SQL crudo (puede incluir markdown, múltiples SQLs, texto)
   ↓
extractFirstSQL() → Extrae solo el primer SELECT
   ↓
sqlValidator.validate() → Valida seguridad
   ↓
dbManager.executeQuery() → Ejecuta contra DB objetivo
   ↓
Retorna: rows[] (datos crudos)

Paso 2: Interpretación de Resultados
────────────────────────────────────
Prompt: "Interpreta estos datos para el usuario"
   ↓
IA Genera respuesta conversacional
   ↓
Guarda en Message (chat history)
   ↓
Retorna al cliente: { reply, sqlExecuted, chartData }
```

## API Endpoints

### Chat (`/api/chat`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/` | Procesa pregunta (Two-Pass RAG) |
| GET | `/` | Lista historial de chats |
| GET | `/:chatId/messages` | Mensajes de un chat |
| DELETE | `/:chatId` | Elimina chat |

**Request POST /**:
```json
{
  "question": "ventas por mes",
  "targetDbId": 1,
  "historyId": null  // o ID para continuar chat
}
```

**Response**:
```json
{
  "success": true,
  "reply": "Las ventas del mes fueron...",
  "sqlExecuted": "SELECT * FROM ventas...",
  "chartData": [{"mes": "Ene", "total": 100}, ...],
  "historyId": 123
}
```

### Rules (`/api/rules`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Lista todas las reglas |
| POST | `/` | Crea nueva regla |
| PUT | `/:id` | Actualiza regla |
| DELETE | `/:id` | Elimina regla |

**Categorías de Reglas**:
- `ESTRUCTURA_DB`: Esquemas DDL de tablas
- `PROMPT_SISTEMA`: Prompts base del asistente
- `EJEMPLO_SQL`: Ejemplos few-shot (legacy)
- `PROMPT_NEGOCIO`: Instrucciones post-SQL (legacy)

### Databases (`/api/databases`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Lista conexiones configuradas |
| POST | `/` | Crea nueva conexión |
| PUT | `/:id` | Actualiza conexión |
| DELETE | `/:id` | Elimina conexión |
| POST | `/:id/test` | Test de conectividad |

## Servicios Core

### aiService.js

Integración con proveedores de IA:

```javascript
// Ollama (local)
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3

// OpenRouter (cloud)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-...
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct
```

### sqlValidator.js

Validación multicapa de SQL generado por IA:

1. **Extracción**: `extractFirstSQL()` - Extrae primer SQL de respuestas complejas
2. **Limpieza**: Remueve markdown, comentarios, separadores
3. **Whitelist**: Solo SELECT, SHOW, DESCRIBE, WITH
4. **Blacklist**: Bloquea INSERT, UPDATE, DELETE, DROP, etc.
5. **Anti-inyección**: Detecta múltiples statements
6. **Auto-limit**: Agrega LIMIT 100 si falta

### promptBuilder.js

Construye prompts dinámicos usando reglas de la BD:

```javascript
// Busca reglas activas por categoría
const rules = await fetchActiveRules(['PROMPT_SISTEMA', 'ESTRUCTURA_DB', 'EJEMPLO_SQL']);

// Construye prompt específico para cada paso
buildSQLPrompt(question, dbDescription)      // Paso 1
buildBusinessPrompt(question, results, sql)  // Paso 2
buildClassifierPrompt(question)              // Paso 0
buildGeneralChatPrompt(question, history)    // Chat general
```

### dbManager.js

Connection pooling con mysql2:

```javascript
// Crear pool dinámico por databaseId
const pool = await getConnection(databaseId);

// Ejecutar query
const { rows, fields } = await executeQuery(databaseId, sql);

// Test conexión
const isConnected = await testConnection(dbConfig);
```

## Configuración

### Variables de Entorno (.env)

```env
# Servidor
PORT=3000

# Proveedor de IA
AI_PROVIDER=ollama                    # 'ollama' o 'openrouter'
OPENROUTER_API_KEY=tu_api_key         # Solo si AI_PROVIDER=openrouter
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3

# Base de datos de memoria (Sequelize)
MEM_DB_HOST=localhost
MEM_DB_PORT=3306
MEM_DB_USER=root
MEM_DB_PASS=
MEM_DB_NAME=ai_memory_db
```

### Base de Datos de Memoria

Tablas creadas por Sequelize:

```sql
-- Chats (conversaciones)
CREATE TABLE Chats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  databaseId INT,
  createdAt DATETIME,
  updatedAt DATETIME
);

-- Messages (mensajes individuales)
CREATE TABLE Messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  chatId INT,
  role ENUM('user', 'assistant'),
  content TEXT,
  sqlExecuted TEXT,
  databaseUsed VARCHAR(255),
  createdAt DATETIME,
  updatedAt DATETIME
);

-- ContextRules (reglas de contexto)
CREATE TABLE ContextRules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(255) UNIQUE,
  category ENUM('PROMPT_SISTEMA', 'ESTRUCTURA_DB', 'EJEMPLO_SQL', 'PROMPT_NEGOCIO'),
  content TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME,
  updatedAt DATETIME
);

-- DatabaseConnections (conexiones configuradas)
CREATE TABLE DatabaseConnections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  host VARCHAR(255),
  port INT,
  user VARCHAR(255),
  password VARCHAR(255),
  database VARCHAR(255),
  description TEXT,
  schemaGroup VARCHAR(255) DEFAULT 'default',  -- Grupo para compartir ejemplos entre BDs similares
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME,
  updatedAt DATETIME
);

-- QueryMemories (ejemplos de entrenamiento few-shot)
CREATE TABLE QueryMemories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionText TEXT,
  sqlQuery TEXT,
  databaseId INT,
  schemaGroup VARCHAR(255) DEFAULT 'default',  -- Grupo del esquema
  rowsReturned INT,
  executionTimeMs INT,
  score FLOAT DEFAULT 1.0,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## Sistema de QueryMemory (Few-Shot Learning)

El sistema implementa **aprendizaje continuo** guardando ejemplos de consultas SQL exitosas para mejorar futuras respuestas.

### SchemaGroup - Compartir Ejemplos entre Bases de Datos

El campo `schemaGroup` permite agrupar bases de datos con **estructuras idénticas** para compartir ejemplos de entrenamiento:

```
Sucursal A (schemaGroup: "sucursales_v1")
Sucursal B (schemaGroup: "sucursales_v1")  ← Comparten ejemplos
Sucursal C (schemaGroup: "sucursales_v1")  ← Comparten ejemplos
Cliente XYZ (schemaGroup: "cliente_xyz")   ← Grupo separado
```

**Flujo de funcionamiento:**
1. Usuario guarda ejemplo en "Sucursal A"
2. Al preguntar en "Sucursal B", el sistema busca ejemplos del grupo "sucursales_v1"
3. La IA recibe ejemplos relevantes como contexto few-shot

### API QueryMemory (`/api/query-memory`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/?databaseId=1&limit=10` | Lista ejemplos por BD o grupo |
| POST | `/` | Guarda nuevo ejemplo (con test opcional) |
| DELETE | `/:id` | Elimina ejemplo |
| POST | `/generate-sql` | Genera SQL usando ejemplos como contexto |

**Request POST /**:
```json
{
  "questionText": "ventas del mes pasado",
  "sqlQuery": "SELECT * FROM ventas WHERE fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)",
  "databaseId": 1,
  "testFirst": true  // Ejecuta SQL antes de guardar
}
```

## Optimizaciones para LLMs Locales

El sistema está optimizado para modelos con contexto limitado (128K tokens):

| Optimización | Implementación | Archivo |
|--------------|----------------|---------|
| Sampling de resultados | Limita a 50 registros con muestreo inteligente | `promptBuilder.js:65-85` |
| Auto-limit SQL | Agrega `LIMIT 100` a consultas sin límite | `sqlValidator.js:74-80` |
| Truncamiento de esquema | Máximo 8K caracteres de DDL | `promptBuilder.js:30-42` |
| Historial reducido | Solo últimos 3 mensajes | `chatController.js:54-58` |
| Contexto Paso 2 | Máximo ~15K caracteres | `promptBuilder.js:64-82` |
| Few-shot con QueryMemory | Incluye hasta 3 ejemplos similares | `queryMemoryService.js` |

## Seguridad

### Validación SQL (sqlValidator.js)

```javascript
// Ejemplo de validación
const { validate, extractFirstSQL } = require('./services/sqlValidator');

// Respuesta compleja de IA
const rawResponse = `
SELECT * FROM ventas;
---
**Nota:** También puedes usar:
\`\`\`sql
SELECT * FROM pedidos;
\`\`\`
`;

// Extrae solo el primer SQL
const extracted = extractFirstSQL(rawResponse);
// Resultado: "SELECT * FROM ventas;"

// Valida
const result = validate(extracted);
// result.isValid = true
// result.cleanSQL = "SELECT * FROM ventas LIMIT 100;"
```

### Recomendaciones de Seguridad

1. **Usuarios READ ONLY**: Configurar usuarios MySQL con privilegios de solo lectura para las conexiones objetivo
2. **Validación multicapa**: Whitelist + Blacklist + Anti-inyección
3. **No expongas `.env`**: Usa variables de entorno en producción
4. **Rate limiting**: Considera agregar `express-rate-limit` para producción

## Scripts NPM

```bash
# Desarrollo (auto-reload con --watch)
npm run dev

# Producción
npm start

# Seed de datos iniciales
npm run seed
```

## Debugging

El sistema incluye logging detallado en consola:

```
📝 === RESPUESTA COMPLETA DE LA IA ===
SELECT * FROM ventas WHERE fecha = '2024-01-01';
---
**Nota:** ...
=====================================

✂️ === SQL EXTRAÍDO ===
SELECT * FROM ventas WHERE fecha = '2024-01-01';
======================

🔍 SQL Validator - Input: SELECT * FROM ventas...
🔍 SQL Validator - Cleaned: SELECT * FROM ventas...
✅ SQL Validator - SQL válido

📝 Contexto enviado a ollama: ~1250 tokens (5000 chars)
```

## Dependencias Principales

```json
{
  "express": "^4.21.2",
  "sequelize": "^6.37.5",
  "mysql2": "^3.12.0",
  "openai": "^6.33.0",
  "axios": "^1.7.9",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7"
}
```

## Notas de Desarrollo

- **No uses** `sequelize.sync({ alter: true })` en producción (puede causar `ER_TOO_MANY_KEYS`)
- Usa `sequelize.sync()` para desarrollo con tablas existentes
- Para cambios de esquema, usa migraciones manuales SQL
