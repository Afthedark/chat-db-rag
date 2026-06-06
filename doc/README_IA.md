# 🤖 Guía Completa de Inteligencia Artificial (RAG) y Manual de Consultas

Este documento contiene toda la información técnica sobre el funcionamiento de la Inteligencia Artificial del sistema (RAG), su arquitectura en el backend, y la guía práctica de preguntas, entrenamiento del modelo y glosario del negocio.

---

## Tabla de Contenidos

### [Parte A: Arquitectura y Funcionamiento Interno (Desarrolladores)](#parte-a-arquitectura-y-funcionamiento-interno-desarrolladores)
1. [¿Qué es RAG?](#1-qué-es-rag)
2. [Flujo completo de una pregunta](#2-flujo-completo-de-una-pregunta)
3. [Arquitectura de archivos IA](#3-arquitectura-de-archivos-ia)
4. [engine.py — El cerebro del RAG](#4-enginepy--el-cerebro-del-rag)
5. [business_context.py — El conocimiento del negocio](#5-business_contextpy--el-conocimiento-del-negocio)
6. [llm.py — El conector con los modelos](#6-llmpy--el-conector-con-los-modelos)
7. [database.py — El proveedor de schema](#7-databasepy--el-proveedor-de-schema)
8. [Context limit — Qué es y cómo afecta](#8-context-limit--qué-es-y-cómo-afecta)
9. [Proveedores LLM — Ollama vs Gemini vs OpenRouter](#9-proveedores-llm--ollama-vs-gemini-vs-openrouter)
10. [Configuración rápida en .env](#10-configuración-rápida-en-env)

### [Parte B: Guía de Preguntas, Entrenamiento y Glosario (Usuarios y Administradores)](#parte-b-guía-de-preguntas-entrenamiento-y-glosario-usuarios-y-administradores)
11. [Principios Fundamentales](#11-principios-fundamentales)
12. [Tipos de Preguntas Válidas](#12-tipos-de-preguntas-válidas)
13. [Preguntas Problemáticas y Reformulaciones](#13-preguntas-problemáticas-y-reformulaciones)
14. [Cómo Crear Nuevas Preguntas](#14-cómo-crear-nuevas-preguntas)
15. [Cómo Entrenar la IA](#15-cómo-entrenar-la-ia)
16. [Glosario de Términos](#16-glosario-de-términos)
17. [Proyecciones de Cocina y Volumen (Panel de Control)](#17-proyecciones-de-cocina-y-volumen-panel-de-control)

---

# Parte A: Arquitectura y Funcionamiento Interno (Desarrolladores)

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

**Problema resuelto:** Antes, "dime qué tal fueron las ventas de ayer" se detectaba como casual porque contenía "que tal". Ahora, si hay palabras de negocio, nunca se trata como casual.

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

**Temperatura: `0.1`** (muy baja) — el LLM es más determinista, menos creativo. Esto reduce la chance de que invente cosas.

---

#### `fix_sql_error(schema, question, failed_sql, error_msg, ...)`
Si el SQL falla en MySQL, esta función se llama automáticamente con el mensaje de error para que el LLM lo corrija e intente de nuevo.

```
SQL falla → fix_sql_error() → LLM corrige → reintento → respuesta
                               (temperatura 0.0 — máximo determinismo)
```

---

#### `generate_response(schema, history, question, sql, results, ...)`
Segunda llamada al LLM: recibe la pregunta + el SQL + los resultados reales y genera la respuesta en **español natural**.

---

#### `process_user_query(question, history, provider, model, api_key)`
Orquesta todo el flujo del paso 1 al 7. Es la función que llaman las rutas de la API (`/api/chats/<id>/send`).

---

## 5. `business_context.py` — El conocimiento del negocio

Este archivo contiene el **conocimiento especializado** de la base de datos `pv_mchicken` que se inyecta en cada prompt. Sin él, el LLM ignoraría las reglas específicas del negocio.

### `EXCLUDED_TABLES`
Lista de ~38 tablas SIAT/fiscal que **no** se envían al LLM. Ejemplos: `sinc_parametricatipometodopagos`, `cufds`, `registroeventossignificativos`, etc.

**¿Por qué excluirlas?** Porque el LLM tiene un límite de tokens. Enviar 84 tablas vs 47 tablas ahorra ~2000 tokens y el LLM se enfoca en lo que importa.

---

### `BUSINESS_RULES`
Las 11 reglas críticas que el LLM DEBE aplicar en cada query:

| Regla | Qué hace |
|---|---|
| **RULE 1** | Siempre excluir pedidos anulados: `WHERE p.estado != 'ANULADO'` |
| **RULE 2** | Usar `cant_total` para cantidades reales (no `cantidad` que se vuelve 0 en pedidos entregados) |
| **RULE 3** | Unificar productos `(PLL)` con `TRIM(REPLACE(i.descripcion, '(PLL)', ''))` |
| **RULE 4** | Total global → `SUM(p.total)`. Por producto → `SUM(cant_real * precio)` |
| **RULE 5** | Formato de dinero boliviano: `CONCAT(ROUND(..., 2), ' Bs')` |
| **RULE 6** | Filtros de tiempo siempre sobre `p.fecha` en la tabla `pedidos` |
| **RULE 7 / 7a**| Reglas de análisis horario y filtros de rangos (HOUR, DAYNAME, mañana/tarde/noche, almuerzo) |
| **RULE 8** | Reglas de búsqueda flexible de productos (LIKE insensitivo, sinónimos, abreviaciones) |
| **RULE 9** | **Fórmula de Insumos y Conversión**: Mapea platos compuestos a presas/alas/sanguchitas base mediante `lin_items` y multiplica la cantidad por `li.cantidad` |
| **RULE 10**| **Consolidador en Litros**: Multiplica cantidad por `i.litros_por_unidad` para reportar volúmenes de refrescos y salsas |
| **RULE 11**| **Offsets de Fecha**: Permite comparar "ayer" (`INTERVAL 1 DAY`) con "mismo día semana pasada" (`INTERVAL 7 DAY`) |

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

Gestiona la comunicación con los modelos de IA. Soporta tres proveedores:

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

### `OpenRouterClient` — Integración Cloud Multi-modelo

Permite utilizar modelos comerciales externos de alta disponibilidad (como Anthropic Claude, Meta Llama 3 o Nemotron) a través de la API global de OpenRouter.

---

## 7. `database.py` — El proveedor de schema

### `get_schema(use_cache=True)`
Obtiene la estructura de la BD. Con `use_cache=True`, la primera vez consulta MySQL y guarda el resultado en memoria. Las siguientes veces devuelve el cache (sin consultar la BD de nuevo).

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

El **context limit** (`num_ctx`) es la "memoria de trabajo" del modelo: cuánto texto puede procesar al mismo tiempo, medido en **tokens**.

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

## 9. Proveedores LLM — Ollama vs Gemini vs OpenRouter

| Característica | Ollama (local) | Gemini API (cloud) | OpenRouter (cloud) |
|---|---|---|---|
| **Costo** | Gratis (usa tu GPU) | Gratis hasta límite diario | Pago por token (o modelos `:free`) |
| **Velocidad** | 10–30s por mensaje | 1–3s por mensaje | Variable (1–4s) |
| **Privacidad** | 100% local, sin internet | Los datos pasan por Google | Los datos pasan por OpenRouter |
| **Calidad SQL** | Buena (depende del modelo) | Muy buena | Excelente (según modelo) |
| **Requiere internet** | No | Sí | Sí |
| **Límite de contexto** | Tu VRAM lo limita | 1,000,000 tokens | Depende del modelo seleccionado |
| **Configuración** | Instalar Ollama + modelo | Clave Gemini en `.env` | Clave OpenRouter en `.env` |

### Cómo activar Gemini:
```ini
# backend/.env
GEMINI_API_KEY_ID_1=AIza...tu-clave-aqui
```
Luego al crear un chat, selecciona **Google Gemini** como proveedor.

### Cómo activar OpenRouter:
```ini
# backend/.env
OPENROUTER_API_KEY=sk-or-v1-...tu-clave-aqui
```
Luego al crear un chat, selecciona **OpenRouter** como proveedor.

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

# ── OPENROUTER ─────────────────────────────────────────
OPENROUTER_API_KEY=          # pegar aquí tu API Key de OpenRouter
```

> 🔑 **Regla de oro:** El `.env` siempre tiene prioridad sobre los valores en `config.py`.  
> Si cambias algo en `config.py` pero existe en `.env`, el `.env` gana.

---

# Parte B: Guía de Preguntas, Entrenamiento y Glosario (Usuarios y Administradores)

## 11. Principios Fundamentales

### Regla de Oro: Una Pregunta = Un Tipo de Dato

✅ **FUNCIONA:** La pregunta pide UN solo tipo de resultado
- Un número (total, conteo, promedio)
- Una lista de items (productos, clientes)
- Una tabla de datos (ranking, comparación)

❌ **NO FUNCIONA:** La pregunta mezcla tipos de datos
- Total + Lista de productos
- Promedio + Ranking detallado
- Conteo + Descripción completa

### ¿Por qué falla la combinación?

SQL requiere que `UNION ALL` tenga el **mismo número de columnas**:

```sql
-- ❌ INVÁLIDO: 1 columna vs 3 columnas
SELECT 'TOTAL', SUM(total) FROM pedidos          -- 2 columnas
UNION ALL
SELECT producto, cantidad, precio FROM items     -- 3 columnas
```

---

## 12. Tipos de Preguntas Válidas

### 12.1 VENTAS Y TOTALES (solo números)

**Estructura:** "¿Cuál/Cuánto/Cuántas [métrica] de [período]?"

| Pregunta | Tipo de Respuesta |
|---|---|
| "¿Cuál fue el total de ventas de marzo 2026?" | Número (Bs) |
| "¿Cuánto vendimos ayer?" | Número (Bs) |
| "Dime el monto total de esta semana" | Número (Bs) |
| "¿Cuál es la facturación del día 15 de abril?" | Número (Bs) |
| "Total de ingresos del mes pasado" | Número (Bs) |
| "¿Cuánto se vendió en el primer trimestre?" | Número (Bs) |
| "Promedio de ventas diarias en marzo" | Número (Bs) |
| "Monto acumulado de ventas de la semana" | Número (Bs) |

**Variaciones de período:**
- Hoy / Ayer / Mañana
- Esta semana / Semana pasada / Últimos 7 días
- Este mes / Mes pasado / Marzo 2026 / Abril 2026
- Este año / 2026 / 2025
- Primer trimestre / Segundo semestre
- Del 1 al 15 de abril / Entre fechas específicas

---

### 12.2 PRODUCTOS MÁS VENDIDOS (listas con datos)

**Estructura:** "Dime los [N] [productos/items] más vendidos [período]"

| Pregunta | Tipo de Respuesta |
|---|---|
| "Dime los 5 productos más vendidos hoy" | Lista: producto + cantidad |
| "Top 10 de productos más vendidos esta semana" | Lista: producto + cantidad + total |
| "¿Qué productos tuvieron más ventas en marzo?" | Lista: producto + cantidad |
| "Ranking de productos por ventas en abril" | Lista ordenada |
| "Los 20 ítems más populares del mes" | Lista: producto + cantidad |
| "Productos estrella de esta semana" | Lista destacada |
| "Lista de productos ordenados por ventas" | Lista completa |

**Con detalle adicional:**
- "Dime los 10 productos más vendidos en marzo y **cuánto vendió cada uno**"
- "Top 5 productos con sus cantidades y montos"
- "Ranking de productos: nombre, unidades vendidas, total en Bs"

---

### 12.3 PRODUCTOS ESPECÍFICOS (consulta individual)

**Estructura:** "¿Cuánto/Cuántos [métrica] de [producto específico] [período]?"

| Pregunta | Tipo de Respuesta |
|---|---|
| "¿Cuánto vendimos de Broaster Mixto en marzo?" | Número (cantidad + Bs) |
| "Ventas del producto 'Combo Familiar' esta semana" | Número |
| "¿Cuántas unidades de Alitas 6pz se vendieron?" | Número (unidades) |
| "Total vendido de Coca Cola 1L en abril" | Número (Bs) |
| "¿Cuántos sandwiches de pollo se vendieron ayer?" | Número (unidades) |
| "Monto total del producto 'PROMO 2 Presas'" | Número (Bs) |
| "Unidades vendidas de Extra Papa Grande" | Número (unidades) |

**Búsqueda parcial (funciona con LIKE):**
- "Ventas de productos con 'Broaster' en el nombre"
- "¿Cuánto se vendió de bebidas Coca Cola?"
- "Productos que contienen 'Alitas'"

---

### 12.4 CATEGORÍAS DE PRODUCTOS

**Bebidas:**
- "¿Cuántas bebidas vendimos hoy?"
- "Top 5 bebidas más vendidas esta semana"
- "Ventas de gaseosas vs jugos en marzo"
- "¿Qué bebida vendió más: Coca Cola o Pepsi?"

**Combos y Promociones:**
- "¿Cuántos combos se vendieron ayer?"
- "Ventas de promociones 3x2 en abril"
- "¿Qué promos vendieron más esta semana?"
- "Total de combos familiares vendidos"

**Extras y Adicionales:**
- "¿Cuántos extras de papa se vendieron?"
- "Ventas de adicionales de arroz"
- "¿Qué extras piden más los clientes?"

**Productos Bañados:**
- "¿Cuántos productos bañados vendimos?"
- "Top productos bañados del mes"
- "Ventas de pollo bañado vs normal"

**Para Llevar (PLL):**
- "¿Cuántos pedidos para llevar tuvimos?"
- "Productos PLL más vendidos"
- "Ventas de llevar vs comer aquí"

---

### 12.5 CONSULTAS POR TIEMPO (tendencias)

**Diarias:**
- "Ventas de los últimos 7 días"
- "¿Cómo fueron las ventas esta semana día por día?"
- "Comparación de ventas: hoy vs ayer"

**Semanales:**
- "Comparación de ventas semana vs semana anterior"
- "¿Qué día de la semana vendemos más?"
- "Ventas por día de la semana en marzo"

**Mensuales:**
- "Ventas por mes en 2026"
- "¿Cuál fue el mejor mes de ventas?"
- "Comparación: marzo vs abril"

**Por Horario/Turno:**
- "¿A qué hora vendemos más?"
- "Ventas por turno: mañana vs tarde"
- "¿Cuál es el horario pico?"

---

### 12.6 CLIENTES

**Conteos:**
- "¿Cuántos clientes únicos tuvimos hoy?"
- "Número de clientes nuevos esta semana"
- "¿Cuántos pedidos hizo el cliente con ID 123?"

**Por cliente específico:**
- "Historial de compras del cliente Juan Pérez"
- "¿Cuánto ha gastado el cliente María en total?"
- "Últimos pedidos del cliente con teléfono 789..."

**Listas:**
- "Top 10 clientes que más compran"
- "Clientes frecuentes del mes"

---

### 12.7 EMPLEADOS Y CAJAS

**Ventas por empleado:**
- "¿Cuánto vendió cada empleado hoy?"
- "Ranking de ventas por cajero esta semana"
- "¿Quién atendió más pedidos ayer?"

**Por caja/turno:**
- "Ventas por caja número 1"
- "¿Cuánto se vendió en el turno de la mañana?"
- "Comparación de ventas por turno"

---

### 12.8 INVENTARIO Y ALMACÉN

**Stock:**
- "¿Qué productos tienen bajo stock?"
- "Lista de ítems con menos de 10 unidades"
- "Productos agotados"

**Movimientos:**
- "¿Qué productos entraron al almacén hoy?"
- "Salidas de inventario de la semana"
- "Movimientos de stock en marzo"

---

### 12.9 CONSULTAS DE ESTRUCTURA (metadata)

**Tablas:**
- "¿Qué tablas hay en la base de datos?"
- "Muéstrame la estructura de la tabla pedidos"
- "¿Qué columnas tiene la tabla items?"

**Relaciones:**
- "¿Cómo se relacionan pedidos y facturas?"
- "¿Qué campos tiene la tabla de clientes?"

---

## 13. Preguntas Problemáticas y Reformulaciones

### ❌ TIPO 1: Total + Lista (mezcla incompatible)

| ❌ NO FUNCIONA | ✅ REFORMULADA |
|---|---|
| "Ventas de marzo **y** productos más vendidos" | **"¿Cuál fue el total de ventas de marzo?"** (pregunta 1) + **"Dime los productos más vendidos en marzo"** (pregunta 2) |
| "Dime el total **y** el top 5 de productos" | Primero: "Total de ventas de hoy" → Luego: "Top 5 productos de hoy" |
| "¿Cuánto vendimos **y** qué se vendió más?" | Separar en dos preguntas |
| "Ventas del mes **con** detalle de productos" | "Total de ventas del mes" → "Productos vendidos este mes" |

**¿Por qué falla?** SQL no puede combinar un SELECT de 1 columna (total) con uno de 3 columnas (producto, cantidad, monto) usando UNION ALL.

---

### ❌ TIPO 2: Múltiples métricas incompatibles

| ❌ NO FUNCIONA | ✅ REFORMULADA |
|---|---|
| "Ventas, productos y clientes de hoy" | Tres preguntas separadas |
| "Dime todo: total, ranking, promedio" | Una por una |
| "¿Cómo estamos en ventas, stock y empleados?" | Dividir en consultas específicas |

---

### ❌ TIPO 3: Preguntas ambiguas

| ❌ AMBIGUA | ✅ ESPECÍFICA |
|---|---|
| "¿Cómo van las ventas?" | "¿Cuál fue el total de ventas de hoy?" |
| "¿Qué tal el mes?" | "¿Cuánto vendimos en marzo?" |
| "Dime los números" | "Dime el total de ventas y cantidad de pedidos" |
| "¿Qué pasó ayer?" | "¿Cuánto se vendió ayer?" |

---

### ❌ TIPO 4: Comparaciones complejas

| ❌ COMPLEJA | ✅ SIMPLE |
|---|---|
| "Compara ventas de todos los meses del año con el año pasado" | "Ventas por mes en 2026" (luego manualmente comparas) |
| "Diferencia porcentual de ventas entre cada día de la semana" | "Ventas por día de la semana esta semana" |

---

## 14. Cómo Crear Nuevas Preguntas

### Paso 1: Identificar qué quieres saber

Define claramente:
- **¿Qué dato?** (cantidad, monto, lista, ranking)
- **¿De qué?** (producto, categoría, cliente, empleado)
- **¿Cuándo?** (período específico)

### Paso 2: Verificar que sea UN tipo de dato

✅ **Válido:**
- "¿Cuántos?" → Conteo (número)
- "¿Cuál es el total?" → Monto (número)
- "Dime los..." → Lista (varias filas)
- "Top/Ranking..." → Lista ordenada

❌ **Inválido (mezcla):**
- "¿Cuántos y cuáles?" → Conteo + Lista
- "Total y detalle" → Número + Lista

### Paso 3: Usar términos del glosario

| Término del usuario | Término en BD |
|---|---|
| sandwich, sándwich | sanguchita |
| bañada, bañado | ba%ada (LIKE) |
| para llevar, PLL | llevar = 1 o descripcion LIKE '%(PLL)%' |
| bebida, gaseosa | descripcion LIKE '%Coca%' OR '%Pepsi%' |
| combo, promoción, promo | descripcion LIKE '%Combo%' OR '%PROMO%' |
| pollo, broaster | descripcion LIKE '%Broaster%' OR '%Pollo%' |
| alitas, wings | descripcion LIKE '%Alitas%' |
| papa, papas | descripcion LIKE '%Papa%' |
| arroz | descripcion LIKE '%Arroz%' |

### Paso 4: Estructurar la pregunta

**Fórmula:**
```
[Verbo] + [métrica] + [filtro opcional] + [período]
```

**Ejemplos:**
- "Dime" + "los 5 productos más vendidos" + "de bebidas" + "esta semana"
- "¿Cuánto" + "se vendió" + "de Broaster" + "en marzo?"
- "Total" + "de ventas" + "" + "del día de hoy"

### Paso 5: Probar y ajustar

Si la IA no entiende:
1. Simplifica la pregunta
2. Usa términos más directos
3. Elimina adjetivos innecesarios
4. Especifica el período claramente

---

## 15. Cómo Entrenar la IA

### 15.1 Agregar Nuevas Reglas de Negocio

**Archivo:** [business_context.py](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/backend/business_context.py)

Para enseñar a la IA una nueva regla:

```python
# Agregar a BUSINESS_RULES
RULE_XX = """
=== RULE XX — [Nombre de la regla] ===
[Explicación clara de qué hacer]
Ejemplo SQL:
[Ejemplo de cómo aplicarla]
"""
```

**Ejemplo real:**
```python
RULE_7 = """
=== RULE 7 — Exclusión de productos descontinuados ===
Cuando consultes productos, excluye los descontinuados:
WHERE i.activo = 1 AND i.descontinuado = 0
Ejemplo:
SELECT i.descripcion FROM items i WHERE i.activo = 1;
"""
```

---

### 15.2 Agregar Términos al Glosario

**Archivo:** [business_context.py](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/backend/business_context.py) → `TABLE_GLOSSARY`

```python
"nuevo_termino": """
"nuevo_termino" → LIKE '%patron_en_bd%'
Ejemplo: "nuevo_termino" busca: descripcion LIKE '%patron%'
""",
```

**Ejemplo:**
```python
"postre": """
"postre", "dulce", "helado" → LIKE '%postre%' OR '%helado%' OR '%torta%'
Ejemplo: "postres vendidos" busca: descripcion LIKE '%postre%'
""",
```

---

### 15.3 Agregar Ejemplos Few-Shot

**Archivo:** [engine.py](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/backend/services/engine.py) → función `generate_sql()`

En el template del prompt, agrega ejemplos similares a tu pregunta:

```python
Examples:
Question: [Tu pregunta ejemplo]
SQL Query: [El SQL correcto]
```

**Ejemplo:**
```python
Question: Top 3 postres más vendidos en febrero
SQL Query: SELECT TRIM(REPLACE(i.descripcion,'(PLL)','')) AS producto, 
  SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS vendidos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id=lp.pedido_id 
JOIN items i ON lp.item_id=i.item_id 
WHERE YEAR(p.fecha)=2026 AND MONTH(p.fecha)=2 
  AND p.estado!='ANULADO' 
  AND (i.descripcion LIKE '%postre%' OR i.descripcion LIKE '%helado%')
GROUP BY producto ORDER BY vendidos DESC LIMIT 3;
```

---

### 15.4 Agregar Palabras Clave de Negocio

**Archivo:** [engine.py](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/backend/services/engine.py) → `BUSINESS_KEYWORDS`

Si la IA trata como "casual" una pregunta de negocio, agrega las palabras:

```python
BUSINESS_KEYWORDS = [
    # ... existentes ...
    'nueva_palabra_clave',  # Agregar aquí
    'otra_palabra',
]
```

**Ejemplo:**
```python
BUSINESS_KEYWORDS = [
    # ... existentes ...
    'inventario',      # Para preguntas de stock
    'proveedor',       # Para preguntas de compras
    'devolucion',      # Para preguntas de devoluciones
]
```

---

### 15.5 Proceso para Agregar Nueva Funcionalidad

**Paso 1:** Identificar el gap
- ¿Qué pregunta no responde bien?
- ¿Qué término no reconoce?
- ¿Qué regla falta?

**Paso 2:** Probar manualmente
- Escribe el SQL correcto para esa pregunta
- Verifica que funcione en MySQL
- Identifica qué parte del contexto necesita

**Paso 3:** Actualizar el contexto
- Agrega reglas a `business_context.py`
- Agrega ejemplos a `engine.py`
- Agrega keywords si es necesario

**Paso 4:** Probar con la IA
- Reinicia el backend
- Haz la pregunta
- Verifica el SQL generado
- Si falla, ajusta y repite

**Paso 5:** Documentar
- Agrega la pregunta a esta guía
- Explica la reformulación si aplica
- Comparte con el equipo

---

## 16. Glosario de Términos

### Términos de Negocio

| Término | Significado en el Sistema |
|---|---|
| **Pedido** | Orden completa de un cliente |
| **Línea de pedido** | Cada item dentro de un pedido |
| **Item** | Producto del menú |
| **Factura** | Documento fiscal del pedido |
| **Cliente** | Persona que hace el pedido |
| **Empleado/Cajero** | Quien registra el pedido |
| **Estado != 'ANULADO'** | Pedidos válidos (excluye cancelados) |
| **cant_total** | Cantidad real vendida (no la base) |
| **(PLL)** | Para Llevar (indicador en descripción) |
| **Bañado/Bñ** | Producto con salsa especial |

### Términos Técnicos

| Término | Significado |
|---|---|
| **RAG** | Retrieval Augmented Generation |
| **Prompt** | Texto enviado al modelo de IA |
| **Context** | Información de la BD enviada al LLM |
| **Schema** | Estructura de tablas y columnas |
| **Token** | Unidad de texto para el LLM |
| **Temperature** | Creatividad del modelo (0.1 = preciso) |
| **Few-shot** | Ejemplos en el prompt para guiar |

---

## Resumen Rápido

✅ **Haz:**
- Una pregunta = Un tipo de dato
- Especificar período claramente
- Usar términos del glosario
- Dividir preguntas complejas en simples

❌ **Evita:**
- Mezclar totales con listas
- Preguntas ambiguas
- Múltiples métricas en una pregunta
- Suponer que la IA "entiende" contexto implícito

📝 **Recuerda:**
- Si falla, simplifica la pregunta
- Prueba con períodos específicos
- Usa nombres de productos exactos
- Separa en múltiples preguntas si es necesario

---

## Ejemplos de Conversaciones Exitosas

### Ejemplo 1: Ventas del día
```
Usuario: ¿Cuánto vendimos hoy?
IA: Hoy se vendió un total de 12.450,00 Bs

Usuario: Dime los 5 productos más vendidos hoy
IA: Los 5 productos más vendidos fueron:
  1. Broaster Mixto - 25 unidades
  2. Combo Familiar - 18 unidades
  3. Coca Cola 1L - 15 unidades
  4. Alitas 6pz - 12 unidades
  5. Extra Papa Grande - 10 unidades
```

### Ejemplo 2: Análisis mensual
```
Usuario: ¿Cuál fue el total de ventas de marzo?
IA: El total de ventas de marzo de 2026 fue de 228.946,00 Bs

Usuario: Dime los 10 productos más vendidos en marzo
IA: [Lista de 10 productos con cantidades]

Usuario: ¿Cuántos pedidos tuvimos en marzo?
IA: En marzo se registraron 1.247 pedidos
```

### Ejemplo 3: Producto específico
```
Usuario: ¿Cuánto se vendió de Broaster Mixto esta semana?
IA: Esta semana se vendieron 142 unidades de Broaster Mixto, 
    equivalente a 8.520,00 Bs
```

---

## 17. Proyecciones de Cocina y Volumen (Panel de Control)

Esta sección cubre las consultas avanzadas de control de demanda que utiliza el personal de cocina para proyectar la preparación de ingredientes base por hora y consolidar el consumo de líquidos en litros.

### 17.1 Atajos de Cocina y sus Prompts Inyectados

El Panel de Cocina del sidebar cuenta con atajos rápidos de un solo clic que inyectan consultas altamente específicas al chat:

| Acceso Rápido | Categoría | Prompt Inyectado | Propósito |
|---|---|---|---|
| **🕒 Presas: Miércoles Anterior** | Area Broaster | `Proyecta las puestas de presas broaster por hora para hoy basado en el mismo día de la semana pasada` | Muestra una distribución horaria estimada de la cantidad de piezas de pollo broaster necesarias hoy, basándose en la venta exacta del mismo día de la semana anterior, descomponiendo los platos compuestos (como combos familiares) en presas individuales. |
| **🕒 Alas: Sábado Anterior** | Area Broaster | `Proyecta las puestas de alas por hora para hoy basado en el mismo día de la semana pasada` | Genera una curva de preparación horaria estimada de alitas utilizando los datos históricos de hace exactamente 7 días. |
| **🕒 Sanguchitas: Ayer** | Plancha y Horno | `Proyecta las puestas de sanduchitas por hora para hoy basado en el comportamiento de ayer` | Proyecta la cocción de filetes de sándwich por hora basándose en los horarios de mayor afluencia de ventas del día anterior (ayer). |
| **🕒 Pollo al Horno: Ayer** | Plancha y Horno | `Proyecta las puestas de pollo al horno por hora para hoy basado en el comportamiento de ayer` | Estima la preparación y horneado de pollos por hora basándose en la demanda real de ayer. |
| **🥤 Gaseosas/Bebidas en Litros** | Líquidos y Salsas | `Consolidado de bebidas y llajua en litros vendidas el día de ayer` | Consolida todas las bebidas gaseosas y jugos vendidos ayer multiplicando cada unidad por su volumen en litros (ej: Pepsi 2L = 2L, Pepsi 1L = 1L) para conocer la cantidad de litros despachados. |
| **🌶️ Salsas y Líquidos: Hoy** | Líquidos y Salsas | `Reporte de líquidos y salsas en litros vendidos el día de hoy` | Suma el volumen total de litros consumidos hoy para salsas base (como Llajua) y aderezos líquidos. |

### 17.2 Ejemplo de Respuesta de Proyección de Cocina

Cuando ejecutas una pregunta del Panel de Cocina, la IA responde con una **tabla Markdown formateada en HTML** que detalla la carga de trabajo recomendada por bloque horario:

```
Usuario: Proyecta las puestas de presas broaster por hora para hoy basado en el mismo día de la semana pasada

IA: Basándome en las ventas de presas broaster registradas el miércoles pasado (fecha: 2026-05-30), a continuación se presenta la proyección de preparación horaria recomendada para el día de hoy:

| Hora | Presas Broaster a Preparar |
| :--- | :--- |
| 11:00 | 12 unidades |
| 12:00 | 45 unidades (Hora pico de almuerzo) |
| 13:00 | 38 unidades |
| 14:00 | 15 unidades |
| 18:00 | 20 unidades |
| 19:00 | 35 unidades (Inicio del turno noche) |
| 20:00 | 50 unidades (Hora pico de cena) |
| 21:00 | 18 unidades |

**Total de presas a producir proyectadas para hoy:** 233 unidades.
*Nota: Recuerda iniciar la cocción con al menos 15 minutos de anticipación al inicio del bloque horario.*
```

---

*Última actualización: Junio 2026*  
*Para agregar nuevas preguntas o reglas, seguir el proceso de la sección 15*
