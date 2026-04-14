# Backend - Chat DB RAG

API RESTful para el asistente empresarial de IA con arquitectura **Two-Pass RAG** que permite consultar bases de datos MySQL mediante lenguaje natural. Optimizado para modelos locales de 8B parámetros (Llama 3.1:8b) con Ollama.

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

Crea el archivo `.env` en la carpeta `backend/` con estas variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# ============================================
# AI Provider: 'ollama' o 'openrouter'
# ============================================
AI_PROVIDER=ollama

# --- OpenRouter (si AI_PROVIDER=openrouter) ---
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct

# --- Ollama Local (si AI_PROVIDER=ollama) ---
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3.1:8b

# ============================================
# Base de datos de memoria (Sequelize/MySQL)
# ============================================
MEM_DB_HOST=localhost
MEM_DB_PORT=3301
MEM_DB_USER=root
MEM_DB_PASS=
MEM_DB_NAME=ai_memory_db

# Ollama Performance Tuning
OLLAMA_NUM_CTX=8192
OLLAMA_TEMPERATURE=0.1
OLLAMA_NUM_PREDICT=500
```

### Referencia de Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor Express |
| `NODE_ENV` | `development` | Entorno (`development` / `production`) |
| `AI_PROVIDER` | `ollama` | Proveedor de IA: `ollama` o `openrouter` |
| `OPENROUTER_API_KEY` | — | API key de OpenRouter |
| `OPENROUTER_MODEL` | `meta-llama/llama-3-70b-instruct` | Modelo a usar en OpenRouter |
| `OLLAMA_URL` | `http://localhost:11434/api/chat` | URL de la API de Ollama |
| `OLLAMA_MODEL` | `llama3.1:8b` | Modelo local de Ollama |
| `OLLAMA_NUM_CTX` | `8192` | Ventana de contexto en tokens |
| `OLLAMA_TEMPERATURE` | `0.1` | Creatividad (0.1 = determinístico, ideal para SQL) |
| `OLLAMA_NUM_PREDICT` | `500` | Máximo tokens de respuesta |
| `MEM_DB_HOST` | `localhost` | Host de la BD de memoria |
| `MEM_DB_PORT` | `3306` | Puerto de la BD de memoria |
| `MEM_DB_USER` | `root` | Usuario de la BD de memoria |
| `MEM_DB_PASS` | _(vacío)_ | Contraseña de la BD de memoria |
| `MEM_DB_NAME` | `ai_memory_db` | Nombre de la BD de memoria |

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
│   └── database.js              # Configuración Sequelize (MySQL)
├── controllers/
│   ├── chatController.js        # Orquestador del flujo Two-Pass RAG
│   ├── databaseController.js    # CRUD de conexiones a BD
│   └── rulesController.js       # CRUD de reglas de contexto
├── middleware/
│   └── errorHandler.js          # Manejo centralizado de errores
├── models/
│   ├── index.js                 # Exporta modelos, relaciones y sequelize
│   ├── Chat.js                  # Modelo de conversaciones
│   ├── Message.js               # Modelo de mensajes (con embedding)
│   ├── DatabaseConnection.js    # Modelo de conexiones a BD
│   ├── ContextRule.js           # Modelo de reglas de contexto IA
│   ├── SQLCache.js              # Modelo de cache SQL
│   └── UserPreference.js        # Modelo de preferencias del usuario
├── routes/
│   ├── chatRoutes.js            # Rutas /api/chat
│   ├── databaseRoutes.js        # Rutas /api/databases
│   ├── rulesRoutes.js           # Rutas /api/rules
│   ├── cacheRoutes.js           # Rutas /api/cache
│   └── preferenceRoutes.js      # Rutas /api/preferences
├── seeds/
│   ├── initialRules.js          # Seed de reglas iniciales (upsert por key)
│   ├── enhancedMemoryMigration.js # Migración de memoria mejorada
│   ├── migrateRules.js          # Migración de reglas legacy
│   ├── populateRuleKeywords.js  # Poblar keywords en reglas existentes
│   └── README_SEEDS.md          # Documentación de seeds
├── services/
│   ├── aiService.js             # Abstracción de proveedores IA (Ollama/OpenRouter)
│   ├── promptBuilder.js         # Constructor de prompts con presupuesto de 7000 chars
│   ├── memoryManager.js         # Smart matching de reglas, cache SQL, preferencias
│   ├── sqlValidator.js          # Validador y auto-corrector de SQL
│   ├── embeddingService.js      # Extracción de keywords y similitud de texto
│   └── dbManager.js             # Pools de conexiones y schema dinámico
├── mcp/
│   ├── handlers/
│   │   ├── connection.js        # Handler MCP de conexiones
│   │   ├── query.js             # Handler MCP de queries
│   │   └── schema.js            # Handler MCP de schema
│   ├── tools/
│   │   ├── definitions.js       # Definición de herramientas MCP
│   │   └── index.js             # Índice de herramientas MCP
│   ├── server.js                # Servidor MCP
│   └── stdio-server.js          # Servidor MCP modo stdio
├── .env                         # Variables de entorno (NO commitear)
├── README_BACKEND.md            # Este archivo
├── README_AI_TRAINING.md        # Guía técnica del pipeline IA y prompt engineering
├── package.json
└── server.js                    # Entry point de la aplicación
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

**Respuesta:**
```json
{
  "success": true,
  "reply": "Hoy se registraron 42 ventas.",
  "sqlExecuted": "SELECT COUNT(*) ...",
  "historyId": 5,
  "fromCache": false
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

### Cache SQL (`/api/cache`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/cache/stats` | Estadísticas del cache (entradas, usos, hit rate) |
| `POST` | `/api/cache/clean` | Limpiar entradas antiguas (body: `{ daysOld: 30 }`) |
| `GET` | `/api/cache/search` | Buscar en cache por similitud (`?question=&databaseId=&threshold=`) |

### Preferencias (`/api/preferences`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/preferences` | Listar preferencias (filtrable por `?category=`) |
| `GET` | `/api/preferences/:key` | Obtener preferencia por key |
| `POST` | `/api/preferences` | Crear/actualizar preferencia |
| `DELETE` | `/api/preferences/:key` | Eliminar preferencia |

### Sistema (`/api/system`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/system/info` | Información del proveedor IA configurado |
| `POST` | `/api/system/cache/cleanup` | Limpieza de cache (utilidad) |

---

## 🧠 Arquitectura Two-Pass RAG

El flujo de procesamiento de cada consulta sigue estos pasos:

```
┌─────────────────────────────────────────┐
│   Paso 0: Clasificación de Intención    │
│   (DATABASE vs GENERAL)                 │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
[GENERAL]  [DATABASE]
    │         │
    │    ┌────┴─────────────────────────────┐
    │    │  Cache Check (hash + similitud)  │
    │    │  ⚡ Si hay HIT → ejecutar cache  │
    │    └────┬─────────────────────────────┘
    │         │ MISS
    │    ┌────┴─────────────────────────────┐
    │    │   Paso 1: Generación SQL         │
    │    │   - extractSchemaForPrompt()     │
    │    │   - Smart context rules          │
    │    │   - buildSQLPrompt (7000 chars)  │
    │    │   - IA genera consulta SQL       │
    │    └────┬─────────────────────────────┘
    │         │
    │    ┌────┴─────────────────────────────┐
    │    │   Validación + Auto-fix SQL      │
    │    │   - Whitelist: SELECT/SHOW       │
    │    │   - TIME()→HOUR() auto-fix       │
    │    │   - Comillas sin cerrar          │
    │    │   - Nombres de tablas            │
    │    └────┬─────────────────────────────┘
    │         │
    │    ┌────┴─────────────────────────────┐
    │    │   Ejecución en BD Objetivo       │
    │    │   - Pool de conexiones dinámico  │
    │    │   - Guarda SQL exitoso en cache  │
    │    └────┬─────────────────────────────┘
    │         │
    │    ┌────┴─────────────────────────────┐
    └────┤   Paso 2: Interpretación         │
         │   - IA interpreta resultados     │
         │   - Respuesta conversacional     │
         └──────────────────────────────────┘
```

> Para una guía técnica detallada del pipeline de IA, prompt engineering, sistema de reglas y troubleshooting, consultar: **[README_AI_TRAINING.md](README_AI_TRAINING.md)**

---

## ⚙️ Configuración de Ollama

### Parámetros enviados a Ollama (`aiService.js`)

```javascript
options: {
    num_ctx: parseInt(process.env.OLLAMA_NUM_CTX) || 8192,
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.1,
    num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT) || 500,
    top_p: 0.9,            // Nucleus sampling (hardcodeado)
    repeat_penalty: 1.1    // Penalización por repetición (hardcodeado)
}
```

- **Temperature 0.1** — Crítica para SQL. Valores altos generan SQL creativo pero roto.
- **num_ctx 8192** — Define el límite total de tokens. El `TOTAL_BUDGET = 7000 chars` del prompt está calibrado para esto.
- **Timeout:** 120 segundos. **Stream:** desactivado (respuesta completa).
- **top_p** y **repeat_penalty** no son configurables por `.env` (hardcodeados).

### Proveedor alternativo: OpenRouter

Si `AI_PROVIDER=openrouter`, usa el SDK de OpenAI con `baseURL` apuntando a OpenRouter:
```
OPENROUTER_API_KEY=tu_key
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct
```

---

## 🧩 Servicios Core

### promptBuilder.js — Constructor de Prompts

Construye prompts dinámicos con **presupuesto de 7000 caracteres** y orden de prioridad optimizado para modelos 8B:

| Sección | Prioridad | Max Chars | Descripción |
|---------|-----------|-----------|-------------|
| [1] ROL + FORMATO | Máxima | ~200 | Instrucciones base del sistema |
| [2] INSTRUCCIONES | Alta | 1500 | Reglas de BD desde `ContextRule` |
| [3] REGLAS HARDCODED | Alta | ~400 | 6 reglas fijas (MySQL, HOUR, etc.) |
| [4] EJEMPLOS SQL | Media | 2000 | Few-shot learning desde `ContextRule` |
| [5] SCHEMA DINÁMICO | Baja | 2000 | Schema real extraído de MySQL |

**Orden de recorte cuando se excede el presupuesto:**
1. Primero: Elimina SCHEMA completamente
2. Segundo: Recorta EJEMPLOS al espacio disponible (mín 200 chars)
3. Nunca se recortan: ROL, INSTRUCCIONES ni REGLAS HARDCODED

**Funciones disponibles:**
- `buildClassifierPrompt()` — Clasifica intención (DATABASE vs GENERAL)
- `buildSQLPrompt()` — Genera SQL con reglas y schema de BD
- `buildBusinessPrompt()` — Interpreta resultados en lenguaje natural
- `buildGeneralChatPrompt()` — Respuestas conversacionales generales

### memoryManager.js — Smart Context Rules y Cache

**Smart Matching (`getSmartContextRules`):**
1. Extrae keywords de la pregunta con `embeddingService.extractKeywords()`
2. Busca reglas que coincidan por keywords **O** por contenido (palabras > 3 chars)
3. Reglas con `keywords = null` o vacío → siempre incluidas (legacy)
4. Ordena por `priority DESC`, luego `matchCount DESC`

**Presupuestos por categoría (RULE_BUDGETS):**

| Categoría | Max Reglas | Max Chars |
|-----------|-----------|-----------|
| `INSTRUCCIONES` | 5 | 2,500 |
| `EJEMPLOS_SQL` | 5 | 3,500 |

**Truncación:** Las reglas se **truncan** al espacio disponible, **nunca se saltan** por completo.

**Cache SQL (`checkSQLCache` / `saveToSQLCache`):**
- Búsqueda por hash exacto (MD5 de la pregunta)
- Fallback por similitud de texto (threshold ≥ 0.5, mín 2 usos)
- SQL exitoso se guarda automáticamente en cache

**Otras funciones:** `summarizeConversation()`, `getDynamicHistoryLimit()`, `inferPreferences()`, `cleanOldCache()`, `getCacheStats()`

### dbManager.js — Conexiones y Schema Dinámico

- Mantiene pools de conexiones en memoria (`Map`)
- Crea pools bajo demanda con `connectionLimit: 5`
- `multipleStatements: false` como protección anti-inyección
- Cierra conexiones graceful con `closeAll()` en `SIGINT`

**Schema dinámico (`extractSchemaForPrompt()`):**
- Extrae schema real de MySQL: `SHOW TABLES` + `DESCRIBE` por tabla
- Formato compacto: `tabla(col1 TIPO PK, col2 TIPO FK, col3 TIPO NOT NULL, ...)`
- Cache de 5 minutos (`SCHEMA_CACHE_TTL = 300000 ms`)
- Máximo 15 tablas, 4000 chars antes de entrar al prompt

### sqlValidator.js — Validador y Auto-corrector SQL

Pipeline de validación en orden:

1. **Limpieza general** — Quita backticks de markdown
2. **Whitelist** — Solo `SELECT`, `SHOW`, `DESCRIBE`, `WITH`
3. **Blacklist** — `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, etc.
4. **Anti-inyección** — Bloquea múltiples sentencias (`;` seguido de texto)
5. **Auto-fixes:**
   - `TIME() BETWEEN` → `HOUR() >= AND HOUR() <` (error frecuente de Llama 3.1)
   - Comillas sin cerrar → cierra antes del siguiente keyword SQL
   - Nombres de tablas incorrectos → rechaza con mensaje indicando el nombre correcto
   - `DATE('now')` (SQLite) → rechaza con mensaje de usar `CURDATE()`
6. **Auto-LIMIT** — Agrega `LIMIT 1000` a SELECT sin límite

### embeddingService.js — Keywords y Similitud

- `extractKeywords()` — Elimina stop words (español + inglés) y palabras ≤ 2 chars
- `calculateTextSimilarity()` — Jaccard + keyword overlap ponderado
- `findSimilarQuestions()` — Busca preguntas similares en cache
- `generateSimpleEmbedding()` — Embedding hash-based (64 dimensiones, sin API externa)

### aiService.js — Abstracción de IA

- **Ollama**: Axios HTTP con opciones configurables (num_ctx, temperature, etc.)
- **OpenRouter**: SDK de OpenAI con `baseURL` apuntando a OpenRouter
- Timeout de 120 segundos, stream desactivado

---

## 🛡️ Seguridad SQL

El sistema implementa múltiples capas de protección en [`sqlValidator.js`](services/sqlValidator.js):

### Whitelist de Comandos Permitidos
- ✅ `SELECT`, `SHOW`, `DESCRIBE`, `WITH` (CTEs)

### Blacklist de Comandos Bloqueados
- ❌ `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`
- ❌ `GRANT`, `REVOKE`, `EXEC`, `EXECUTE`, `CALL`
- ❌ `INTO OUTFILE`, `INTO DUMPFILE`, `LOAD_FILE`

### Protecciones Adicionales
- **Anti-inyección**: Bloquea múltiples sentencias (`;` seguido de texto)
- **Auto-limit**: Agrega `LIMIT 1000` automáticamente a consultas SELECT sin límite
- **Auto-fix TIME→HOUR**: Corrige `TIME() BETWEEN` → `HOUR()` automáticamente
- **Auto-fix comillas**: Cierra comillas simples sin cerrar
- **Corrección de tablas**: Rechaza nombres de tabla conocidos como incorrectos (solo en FROM/JOIN)
- **Anti-SQLite**: Detecta y rechaza `DATE('now')` con sugerencia de usar `CURDATE()`

> **Recomendación**: Usar usuarios MySQL con privilegios **READ ONLY** para las conexiones objetivo.

---

## 🗄️ Modelos de Datos

### Chat
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | Identificador |
| `title` | string | Título de la conversación |
| `databaseId` | integer | Referencia a la BD usada |

### Message
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | Identificador |
| `chatId` | FK → Chat | Conversación asociada |
| `role` | enum | `'user'` o `'assistant'` |
| `content` | text | Contenido del mensaje |
| `sqlExecuted` | text (nullable) | SQL ejecutado |
| `databaseUsed` | string (nullable) | Nombre de la BD usada |
| `embedding` | text (nullable) | Embedding JSON del mensaje |

### DatabaseConnection
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | Identificador |
| `name` | string (único) | Nombre de la conexión |
| `host`, `port`, `user`, `password`, `database` | string/int | Datos de conexión MySQL |
| `isActive` | boolean | Si la conexión está activa |
| `description` | text (nullable) | Descripción/DDL de la BD |

### ContextRule
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | Identificador |
| `key` | string (único) | Identificador de la regla |
| `category` | enum | `'INSTRUCCIONES'`, `'EJEMPLOS_SQL'`, `'SCHEMA'`, `'FEW_SHOT'` |
| `content` | text | Contenido de la regla |
| `isActive` | boolean | Si la regla está activa |
| `keywords` | string(500) (nullable) | Keywords separadas por comas para smart matching |
| `priority` | integer | Prioridad (mayor = más importante) |
| `matchCount` | integer | Contador de usos |

### SQLCache
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | Identificador |
| `questionHash` | string | Hash MD5 de la pregunta |
| `question` | text | Pregunta original |
| `sqlQuery` | text | SQL generado y validado |
| `databaseId` | FK → DatabaseConnection | BD donde se ejecutó |
| `resultPreview` | text (nullable) | Preview JSON (max 500 chars) |
| `useCount` | integer | Veces reutilizado |
| `lastUsed` | date | Última vez usado |
| `similarityScore` | float (nullable) | Score de similitud |

### UserPreference
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | Identificador |
| `preferenceKey` | string (único) | Key de la preferencia |
| `category` | enum | `'database'`, `'query'`, `'display'`, `'behavior'` |
| `value` | text | Valor (puede ser JSON) |
| `frequency` | integer | Veces inferida |
| `confidence` | float | Confianza (0-1) |

---

## 🌱 Sistema de Seeds

Las reglas iniciales se cargan con el script `seeds/initialRules.js` usando lógica de **upsert** (crea si no existe, actualiza si ya existe, por `key`).

**Prioridades de seeds:**
- `INSTRUCCIONES`: `priority = 10` (máxima prioridad)
- `EJEMPLOS_SQL`: `priority = 4` (menor que reglas del usuario por defecto)

```bash
# Ejecutar seed
npm run seed

# Otros scripts de migración
npm run migrate:memory      # Migración de memoria mejorada
npm run seed:keywords       # Poblar keywords en reglas existentes
```

> Para detalles completos sobre cómo personalizar y ejecutar seeds, consultar: **[seeds/README_SEEDS.md](seeds/README_SEEDS.md)**

---

## 📝 Scripts NPM

```bash
npm run dev              # Desarrollo con auto-restart (Node --watch)
npm start                # Producción
npm run seed             # Insertar/actualizar reglas iniciales
npm run migrate:memory   # Migración de memoria mejorada
npm run seed:keywords    # Poblar keywords en reglas existentes
```

---

## 📦 Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| `express` | ^4.21.2 | Framework HTTP |
| `cors` | ^2.8.5 | CORS middleware |
| `dotenv` | ^16.4.7 | Variables de entorno |
| `sequelize` | ^6.37.5 | ORM para MySQL (BD de memoria) |
| `mysql2` | ^3.12.0 | Driver MySQL (pools dinámicos + Sequelize) |
| `axios` | ^1.7.9 | HTTP client (Ollama API) |
| `openai` | ^6.33.0 | SDK OpenAI (para OpenRouter) |
| `@modelcontextprotocol/sdk` | ^1.29.0 | Protocolo MCP |

---

## 🐛 Debugging

El servidor incluye logs detallados en consola. Marcadores clave:

| Marcador | Qué muestra |
|----------|-------------|
| `🎯 Intención detectada:` | Clasificación: DATABASE o GENERAL |
| `🎯 Smart Context Rules Budget:` | Reglas seleccionadas, cantidad y chars por categoría |
| `=== SQL PROMPT DEBUG ===` | Tamaño total del prompt y de cada sección |
| `=== DYNAMIC SCHEMA DEBUG ===` | Schema extraído, tamaño y preview |
| `=== IA RESPONSE DEBUG ===` | SQL crudo generado por la IA |
| `🔧 SQL Fix:` | Correcciones automáticas aplicadas |
| `⚡ SQL Cache HIT:` | Cache encontrado (exacto o por similitud) |
| `🔍 SQL Cache MISS:` | Sin cache, generando SQL nuevo |
| `💾 SQL Cache SAVE:` | SQL exitoso guardado en cache |
| `📋 Schema cache HIT:` | Schema servido desde cache (TTL 5 min) |
| `⚠️ Prompt exceeds budget:` | Prompt excedió 7000 chars, recortando |
| `⚠️ Rule truncated:` | Regla truncada para caber en presupuesto |

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

- [Guía Técnica del Pipeline IA](README_AI_TRAINING.md) — Prompt engineering, sistema de reglas, troubleshooting, errores comunes
- [Guía de Seeds](seeds/README_SEEDS.md) — Cómo personalizar y ejecutar reglas iniciales
- [Documentación Principal](../README.md)
- [Documentación Frontend](../frontend/README_FRONTEND.md)
- [Referencia Deep Chat](../frontend/deepchat.md)
- [Referencia MCP](../MCP_TOOLS_REFERENCE.md)
