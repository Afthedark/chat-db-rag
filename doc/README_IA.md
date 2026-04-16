# 🤖 README — Inteligencia Artificial: Cómo funciona el sistema RAG

## Tabla de Contenidos
1. [¿Qué es RAG?](#1-qué-es-rag)
2. [Flujo completo de una pregunta](#2-flujo-completo-de-una-pregunta)
3. [Arquitectura de archivos IA](#3-arquitectura-de-archivos-ia)
4. [engine.py — El cerebro del RAG](#4-enginepy--el-cerebro-del-rag)
5. [business_context.py — El conocimiento del negocio](#5-business_contextpy--el-conocimiento-del-negocio)
6. [llm.py — El conector con los modelos](#6-llmpy--el-conector-con-los-modelos)
7. [database.py — El proveedor de schema](#7-databasepy--el-proveedor-de-schema)
8. [Context limit — Qué es y cómo afecta](#8-context-limit--qué-es-y-cómo-afecta)
9. [Proveedores LLM — Ollama vs Gemini](#9-proveedores-llm--ollama-vs-gemini)
10. [Configuración rápida en .env](#10-configuración-rápida-en-env)

---

## 1. ¿Qué es RAG?

**RAG** = **R**etrieval **A**ugmented **G**eneration  
*(Generación Aumentada por Recuperación)*

En términos simples: en vez de que la IA adivine la respuesta, primero **busca información real** de tu base de datos y luego genera una respuesta basada en esos datos reales.

```
SIN RAG:                          CON RAG (este proyecto):
Usuario: "¿ventas de hoy?"        Usuario: "¿ventas de hoy?"
IA: "No tengo esa información"    IA busca el schema → genera SQL →
    o inventa una respuesta            ejecuta en MySQL → lee resultados
    falsa                              → responde con datos reales ✅
```

---

## 2. Flujo completo de una pregunta

Cuando escribes algo en el chat, ocurren **7 pasos** en el backend:

```
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 1 — INPUT DEL USUARIO                                         │
│  "¿Cuáles fueron los 5 productos más vendidos hoy?"                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  PASO 2 — ¿Es pregunta casual?          engine.py                   │
│  is_casual_question()                                               │
│  Detecta si es un saludo/pregunta conversacional.                   │
│  Palabras como "ventas", "hoy", "dime" → NO es casual → continúa   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  PASO 3 — RETRIEVAL: Obtener el Schema  database.py                 │
│  db_manager.get_schema(use_cache=True)                              │
│  Obtiene la estructura real de la BD (tablas, columnas, tipos).     │
│  Solo envía las ~18 tablas de negocio relevantes (filtra SIAT).     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  PASO 4 — AUGMENTATION: Construir el Prompt  engine.py              │
│  generate_sql() ensambla un prompt con:                             │
│  • schema filtrado de la BD                                         │
│  • reglas de negocio (business_context.py)                          │
│  • relaciones entre tablas                                          │
│  • glosario de búsqueda                                             │
│  • fecha actual + nombre de BD                                      │
│  • historial de los últimos 5 mensajes                              │
│  • la pregunta del usuario                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  PASO 5 — GENERATION #1: LLM genera el SQL  llm.py                  │
│  llm_manager.query() envía el prompt al modelo (Ollama o Gemini).   │
│  El LLM devuelve el SQL:                                            │
│  SELECT TRIM(REPLACE(i.descripcion,'(PLL)','')) AS producto,        │
│    SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total              │
│        ELSE lp.cantidad END) AS vendidos                            │
│  FROM pedidos p JOIN lin_pedidos lp ... WHERE DATE(p.fecha)=TODAY   │
│  AND p.estado != 'ANULADO' GROUP BY producto ORDER BY vendidos DESC │
│  LIMIT 5;                                                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  PASO 6 — EJECUCIÓN REAL del SQL en MySQL  database.py              │
│  db_manager.execute_query(sql)                                      │
│  Resultado real: [('Sandwich Pollo', 42), ('Combo Familiar', 38)]   │
│  ⚠️ Si falla → autocorrección automática (fix_sql_error())          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  PASO 7 — GENERATION #2: LLM responde en lenguaje natural llm.py    │
│  generate_response() envía pregunta + SQL + resultados al LLM.      │
│  Respuesta: "Los 5 productos más vendidos hoy son:                  │
│              1. Sandwich Pollo - 42 unidades ..."                   │
└─────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **Importante:** El LLM se llama **2 veces por mensaje** — una para generar SQL y otra para interpretar los resultados. Es por eso que cada respuesta tarda el doble.

---

## 3. Arquitectura de archivos IA

```
backend/
├── business_context.py      ← 🧠 Conocimiento específico del negocio
├── config.py                ← ⚙️  Configuración (lee del .env)
├── .env                     ← 🔑 Variables de configuración (EDITAR AQUÍ)
└── services/
    ├── engine.py            ← 🎯 Orquestador — el cerebro del RAG
    ├── llm.py               ← 🤖 Conector con Ollama y Gemini
    └── database.py          ← 🗄️  Gestión de conexión y schema
```

---

## 4. `engine.py` — El cerebro del RAG

Es el archivo más importante del sistema. Coordina todos los pasos del flujo RAG.

### Funciones principales:

#### `is_casual_question(question)`
Detecta si el usuario está saludando o preguntando algo del negocio.

```python
# Palabras que BLOQUEAN la detección casual (siempre van al LLM SQL):
BUSINESS_KEYWORDS = ['ventas', 'pedidos', 'dime', 'busca', 'hoy', 'ayer', ...]

# Palabras que SÍ son casuales:
CASUAL_PATTERNS = ['hola', 'gracias', 'quien eres', 'como estas', ...]
```

**Problema resuelto:** Antes, "dime qué tal fueron las ventas de ayer" se
detectaba como casual porque contenía "que tal". Ahora, si hay palabras de
negocio, nunca se trata como casual.

---

#### `generate_sql(schema, history, question, ...)`
Construye el prompt completo y se lo envía al LLM para que devuelva SQL.

El prompt incluye:
```
=== CURRENT CONTEXT ===
Database name  : pv_mchicken
Today's date   : 2026-04-16
Yesterday      : 2026-04-15

<SCHEMA> ... tablas filtradas ... </SCHEMA>

=== CRITICAL BUSINESS RULES ===
RULE 1 — WHERE p.estado != 'ANULADO'
RULE 2 — CASE WHEN lp.cant_total > 0 THEN ...
RULE 3 — TRIM(REPLACE(i.descripcion, '(PLL)', ''))
...

=== STRICT INSTRUCTIONS ===
1. ONLY use column names from SCHEMA. NEVER invent columns.
...
```

**Temperatura: `0.1`** (muy baja) — el LLM es más determinista, menos
creativo. Esto reduce la chance de que invente cosas.

---

#### `fix_sql_error(schema, question, failed_sql, error_msg, ...)`
Si el SQL falla en MySQL, esta función se llama automáticamente con el mensaje
de error para que el LLM lo corrija e intente de nuevo.

```
SQL falla → fix_sql_error() → LLM corrige → reintento → respuesta
                               (temperatura 0.0 — máximo determinismo)
```

---

#### `generate_response(schema, history, question, sql, results, ...)`
Segunda llamada al LLM: recibe la pregunta + el SQL + los resultados reales
y genera la respuesta en **español natural**.

---

#### `process_user_query(question, history, provider, model, api_key)`
Orquesta todo el flujo del paso 1 al 7. Es la función que llaman las rutas
de la API (`/api/chats/<id>/send`).

---

## 5. `business_context.py` — El conocimiento del negocio

Este archivo contiene el **conocimiento especializado** de la base de datos
`pv_mchicken` que se inyecta en cada prompt. Sin él, el LLM ignoraría las
reglas específicas del negocio.

### `EXCLUDED_TABLES`
Lista de ~38 tablas SIAT/fiscal que **no** se envían al LLM. Ejemplos:
`sinc_parametricatipometodopagos`, `cufds`, `registroeventossignificativos`, etc.

**¿Por qué excluirlas?** Porque el LLM tiene un límite de tokens. Enviar 84
tablas vs 47 tablas ahorra ~2000 tokens y el LLM se enfoca en lo que importa.

---

### `BUSINESS_RULES`
Las 6 reglas críticas que el LLM DEBE aplicar en cada query:

| Regla | Qué hace |
|---|---|
| **RULE 1** | Siempre excluir pedidos anulados: `WHERE p.estado != 'ANULADO'` |
| **RULE 2** | Usar `cant_total` para cantidades reales (no `cantidad` que se vuelve 0) |
| **RULE 3** | Unificar productos `(PLL)` con `TRIM(REPLACE(i.descripcion, '(PLL)', ''))` |
| **RULE 4** | Total global → `SUM(p.total)`. Por producto → `SUM(cant_real * precio)` |
| **RULE 5** | Formato de dinero: `CONCAT(ROUND(..., 2), ' Bs')` |
| **RULE 6** | Filtros de tiempo siempre sobre `p.fecha` en la tabla `pedidos` |

---

### `BUSINESS_RELATIONSHIPS`
Le explica al LLM cómo hacer los JOINs correctamente:
```
pedidos → lin_pedidos  (ON pedido_id)
lin_pedidos → items    (ON item_id)
pedidos → facturas     (ON pedido_id)
pedidos → clientes     (ON cliente_id)
```

---

### `TABLE_GLOSSARY`
Traduce términos del usuario a patrones de búsqueda SQL:
```
"sándwich"   →  LIKE '%sanguchita%'
"bañada"     →  LIKE '%ba%ada%'
"para llevar" → lp.llevar = 1 OR descripcion LIKE '%(PLL)%'
```

---

## 6. `llm.py` — El conector con los modelos

Gestiona la comunicación con los modelos de IA. Soporta dos proveedores:

### `OllamaClient` — Modelos locales

```python
# Parámetros clave:
"num_ctx": Config.OLLAMA_CONTEXT_LIMIT  # tokens de contexto (ahora 8192)
"temperature": 0.1                      # creatividad del modelo
```

Flujo de retry:
```
Intento 1 → falla (timeout) → espera 2s → Intento 2 → falla → espera 4s → Intento 3
```

### `GeminiClient` — API de Google (cloud)

Usa el SDK `google-genai` (nuevo, a partir de 2025). Ventajas:
- Sin límite práctico de contexto
- Respuestas en 1-3 segundos
- No consume recursos de tu PC

---

## 7. `database.py` — El proveedor de schema

### `get_schema(use_cache=True)`
Obtiene la estructura de la BD. Con `use_cache=True`, la primera vez
consulta MySQL y guarda el resultado en memoria. Las siguientes veces
devuelve el cache (sin consultar la BD de nuevo).

```
Primera conexión: consulta MySQL → guarda en memoria
Preguntas 2, 3, 4...: usa la memoria → más rápido
```

**Filtrado de tablas:**
```python
all_tables       = 84 tablas   (todo lo que tiene la BD)
relevant_tables  = 47 tablas   (sin SIAT/fiscal)
→ Log: [Database] Schema: 84 total tables → 47 relevant tables sent to LLM
```

---

## 8. Context limit — Qué es y cómo afecta

El **context limit** (`num_ctx`) es la "memoria de trabajo" del modelo:
cuánto texto puede procesar al mismo tiempo, medido en **tokens**.

> 1 token ≈ 0.75 palabras en español

### ¿Qué consume tokens en cada mensaje?

```
Schema (47 tablas)     ~2,000 tokens
Reglas de negocio      ~  800 tokens
Relaciones de tablas   ~  200 tokens
Glosario               ~  100 tokens
Historial (5 msgs)     ~  400 tokens
Pregunta del usuario   ~   50 tokens
─────────────────────────────────────
TOTAL DE ENTRADA       ~3,550 tokens

Con ctx=4096: queda ~546 para el SQL de salida  ← puede fallar
Con ctx=6144: queda ~2594 para el SQL de salida ← suficiente
Con ctx=8192: queda ~4642 para el SQL de salida ← holgado (pero lento en 3b)
```

### Límites recomendados por modelo en RTX 3060 (12 GB VRAM):

| Modelo | Context recomendado | Velocidad esperada |
|---|---|---|
| `llama3.2:3b` | 5120–6144 | 10–20s estable |
| `llama3.1:8b` | 4096 | 12–20s estable |
| `gemini-2.0-flash` | sin límite práctico | 1–3s |

---

## 9. Proveedores LLM — Ollama vs Gemini

| Característica | Ollama (local) | Gemini API (cloud) |
|---|---|---|
| **Costo** | Gratis (usa tu GPU) | Gratis hasta límite diario |
| **Velocidad** | 10–30s por mensaje | 1–3s por mensaje |
| **Privacidad** | 100% local, sin internet | Los datos pasan por Google |
| **Calidad SQL** | Buena (depende del modelo) | Muy buena |
| **Requiere internet** | No | Sí |
| **Límite de contexto** | Tu GPU lo limita | 1,000,000 tokens |
| **Configuración** | Instalar Ollama + modelo | Solo poner API Key en .env |

### Cómo activar Gemini:
```ini
# backend/.env
GEMINI_API_KEY_ID_1=AIza...tu-clave-aqui
```
Luego al crear un chat, selecciona **Google Gemini** como proveedor.

### Cómo cambiar de modelo Ollama:
```bash
ollama pull llama3.1:8b   # descarga el modelo
```
Luego selecciónalo en el modal "Nuevo Chat" del frontend.

---

## 10. Configuración rápida en `.env`

Todas las variables de IA están en `backend/.env`:

```ini
# ── OLLAMA ─────────────────────────────────────────────
OLLAMA_TIMEOUT=120           # segundos antes de dar timeout
OLLAMA_MAX_RETRIES=3         # reintentos si falla
OLLAMA_RETRY_DELAY=2         # segundos entre reintentos
OLLAMA_CONTEXT_LIMIT=6144    # tokens de contexto (ver sección 8)
MAX_CHAT_HISTORY=5           # mensajes del historial que se envían al LLM

# ── GEMINI ─────────────────────────────────────────────
GEMINI_API_KEY_ID_1=         # pegar aquí tu API Key de Google AI Studio
```

> 🔑 **Regla de oro:** El `.env` siempre tiene prioridad sobre los valores en `config.py`.
> Si cambias algo en `config.py` pero existe en `.env`, el `.env` gana.

---

## Glosario rápido

| Término | Significado |
|---|---|
| **RAG** | Retrieval Augmented Generation — busca datos reales antes de responder |
| **LLM** | Large Language Model — el modelo de IA (Ollama, Gemini) |
| **Token** | Unidad básica de texto para el LLM (~0.75 palabras) |
| **Context limit** | Máximo de tokens que el LLM puede procesar a la vez |
| **Schema** | Estructura de la BD: tablas, columnas, tipos de datos |
| **Prompt** | El texto completo que se envía al LLM |
| **Temperature** | Creatividad del LLM (0.0 = determinista, 1.0 = creativo) |
| **Few-shot** | Ejemplos dentro del prompt para guiar al LLM |
| **VRAM** | Memoria de la GPU — limita el tamaño del contexto en Ollama |
