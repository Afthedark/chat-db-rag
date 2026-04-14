# 🧠 Guía Técnica: Pipeline de IA para Generación SQL (RAG)

> **Audiencia:** Asistentes de IA (Claude, GPT, etc.) y desarrolladores que trabajarán en este proyecto.  
> **Propósito:** Entender el pipeline completo de generación SQL para poder modificar el código sin romper nada.  
> **Última actualización:** Abril 2026

---

## 1. Arquitectura del Pipeline de SQL

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐     ┌────────────────┐
│  Pregunta   │────▶│ extractKeywords  │────▶│ getSmartContextRules  │────▶│ buildSQLPrompt │
│  del usuario│     │ (embeddingService│     │ (memoryManager.js)    │     │ (promptBuilder │
│             │     │  .js)            │     │                       │     │  .js)          │
└─────────────┘     └──────────────────┘     └───────────────────────┘     └───────┬────────┘
                                                                                    │
                    ┌──────────────┐     ┌──────────────────────┐                   │
                    │    MySQL     │◀────│ validateAndCleanSQL  │◀────┐              │
                    │  (ejecución) │     │ (sqlValidator.js)    │     │              │
                    └──────┬───────┘     └──────────────────────┘     │              │
                           │                                    ┌────┴──────┐       │
                           │                                    │  Ollama   │◀──────┘
                           ▼                                    │ (LLM 8B)  │
                    ┌──────────────┐                            └───────────┘
                    │ buildBusiness│
                    │ Prompt → IA  │
                    │ → Respuesta  │
                    │   natural    │
                    └──────────────┘
```

### Flujo paso a paso (ver `chatController.js`):

1. **Clasificación de intención** — `buildClassifierPrompt()` → Ollama → responde `"DATABASE"` o `"GENERAL"`
2. **Si GENERAL** → `buildGeneralChatPrompt()` → respuesta conversacional, no SQL
3. **Si DATABASE**:
   - **Cache check** — `memoryManager.checkSQLCache()` busca si ya existe SQL cacheado para esa pregunta (hash exacto o similitud ≥ 0.5)
   - **Si hay cache hit** → ejecuta el SQL cacheado directamente, salta al paso de interpretación
   - **Si no hay cache** →
     1. `dbManager.extractSchemaForPrompt(targetDbId)` — extrae schema dinámico real de MySQL
     2. `promptBuilder.buildSQLPrompt(question, description, dynamicSchema)` — construye el prompt completo
     3. `aiService.generateResponse()` — envía a Ollama, recibe SQL crudo
     4. `sqlValidator.validate(rawSQL)` — limpia, valida y corrige el SQL
     5. `dbManager.executeQuery()` — ejecuta contra MySQL real
     6. `memoryManager.saveToSQLCache()` — guarda SQL exitoso en cache
     7. `promptBuilder.buildBusinessPrompt()` → Ollama → interpreta resultados en lenguaje natural

---

## 2. Cómo se "Entrena" la IA (Few-Shot Learning)

**⚠️ IMPORTANTE: Esto NO es entrenamiento real.**

El modelo (Llama 3.1:8b por defecto) **nunca se modifica ni se fine-tunea**. Lo que hacemos es **few-shot learning por inyección de prompt**:

1. Se construye un prompt largo que incluye **ejemplos SQL reales** (sección `EJEMPLOS_SQL`)
2. El modelo **imita los patrones** que ve en esos ejemplos
3. Las **INSTRUCCIONES** le dicen qué tablas existen, cómo se relacionan y qué errores NO cometer
4. El **schema dinámico** complementa con la estructura real de la BD

**Analogía:** Es como darle a alguien un examen con las respuestas de ejemplo al lado. No "aprende", simplemente copia el patrón.

### Por qué funciona con 8B:
- Modelos pequeños (8B) son **muy sensibles** al orden y contenido del prompt
- Las INSTRUCCIONES van PRIMERO porque el modelo prioriza lo que ve al inicio
- Los EJEMPLOS son la parte más valiosa: el modelo copia patrones exactos
- El schema va AL FINAL porque es lo primero que se recorta si no cabe

---

## 3. Estructura del Prompt (`buildSQLPrompt` en `promptBuilder.js`)

El prompt se construye en **orden estricto de prioridad** (lo más importante primero):

### [1] ROL + FORMATO (~200 chars) — Siempre incluido
```
Eres experto MySQL. Convierte preguntas en lenguaje natural a SQL.
RESPONDE SOLO con la consulta SQL pura. Sin explicaciones, sin markdown, sin bloques de codigo.
Solo SELECT o SHOW permitidos. NUNCA INSERT, UPDATE, DELETE, DROP.
```

### [2] INSTRUCCIONES (desde BD, máx 1500 chars) — PRIORIDAD MÁXIMA
```
=== INSTRUCCIONES DEL SISTEMA (SEGUIR OBLIGATORIAMENTE) ===
[contenido de reglas categoría INSTRUCCIONES, cortado a 1500 chars]
```
- Vienen de `ContextRule` con `category = 'INSTRUCCIONES'`
- Contienen nombres reales de tablas, JOINs correctos, reglas críticas
- **Si esta sección está vacía, la IA alucinará nombres de tablas**

### [3] REGLAS HARDCODED (6 reglas fijas en el código)
```
=== REGLAS OBLIGATORIAS ===
1. USA EXACTAMENTE los nombres de tablas y columnas de las INSTRUCCIONES arriba - NO INVENTES NOMBRES
2. Sintaxis MySQL: CURDATE() para fecha actual, DATE_SUB() para intervalos - NO uses DATE('now')
3. Para buscar texto: LOWER(columna) LIKE '%termino%'
4. SIEMPRE excluye pedidos anulados: WHERE p.estado != 'ANULADO'
5. Para filtrar por HORA usa: HOUR(p.fecha) >= X AND HOUR(p.fecha) < Y. NUNCA uses TIME() BETWEEN
6. Responde UNICAMENTE con SQL puro listo para ejecutar
```

### [4] EJEMPLOS SQL (desde BD, máx 2000 chars) — Aprendizaje por imitación
```
=== EJEMPLOS SQL (COPIA ESTOS PATRONES EXACTAMENTE) ===
Pregunta: ¿Cuantas ventas hubo hoy?
SQL: SELECT COUNT(*) as total_pedidos FROM pedidos WHERE DATE(fecha) = CURDATE() AND estado != 'ANULADO';
---
[más ejemplos...]
```
- Vienen de `ContextRule` con `category = 'EJEMPLOS_SQL'`
- **Esta es la parte más valiosa para modelos 8B** — copian patrones exactos

### [5] SCHEMA DINÁMICO (desde MySQL real, máx 2000 chars) — PRIORIDAD MÁS BAJA
```
=== SCHEMA DE REFERENCIA (complementario) ===
pedidos(pedido_id INT PK, fecha DATETIME NOT NULL, estado VARCHAR NOT NULL, ...)
lin_pedidos(pedido_id INT FK, item_id INT FK, cantidad DECIMAL, ...)
items(item_id INT PK, descripcion VARCHAR NOT NULL, ...)
```
- Extraído en tiempo real por `dbManager.extractSchemaForPrompt()`
- Formato compacto: `tabla(col1 TIPO PK, col2 TIPO FK, ...)`
- Cache de 5 minutos (`SCHEMA_CACHE_TTL = 300000 ms`)
- Máximo 15 tablas, 4000 chars antes de entrar al prompt

### Presupuesto Total y Orden de Recorte

```
TOTAL_BUDGET = 7000 caracteres (seguro para contexto de 8192 tokens)
```

**Orden de recorte cuando se excede el presupuesto:**
1. **Primero:** Elimina SCHEMA completamente
2. **Segundo:** Recorta EJEMPLOS al espacio disponible (mín 200 chars para incluirlos)
3. **Nunca se recortan:** ROL, INSTRUCCIONES ni REGLAS HARDCODED

```javascript
// Lógica de recorte en promptBuilder.js líneas 90-108:
if (systemPrompt.length > TOTAL_BUDGET) {
    // Step 1: Remove schema entirely
    systemPrompt = roleSection + instrSection + rulesSection + examplesSection;
    if (systemPrompt.length > TOTAL_BUDGET) {
        // Step 2: Trim examples to fit
        const availableForExamples = TOTAL_BUDGET - (roleSection + instrSection + rulesSection).length;
        // ...
    }
}
```

---

## 4. Sistema de Reglas Contextuales (`memoryManager.js`)

### Cómo funciona el Smart Matching

Cuando llega una pregunta, `getSmartContextRules()` ejecuta esta lógica:

1. **Extrae keywords** de la pregunta con `embeddingService.extractKeywords()`
   - Elimina stop words (español e inglés)
   - Elimina palabras de ≤ 2 caracteres
   - Ejemplo: `"¿Cuántas ventas hubo hoy?"` → `["ventas", "hubo", "hoy"]`

2. **Busca reglas** que coincidan por CUALQUIERA de estos criterios (OR):
   - **Keyword matching:** campo `keywords` de la regla contiene algún keyword (`LIKE %keyword%`)
   - **Content matching:** campo `content` de la regla contiene keywords **de más de 3 caracteres** (`LIKE %keyword%`)
   - **Legacy rules:** reglas con `keywords = null` o `keywords = ''` → **siempre se incluyen**

3. **Ordena** por:
   - `priority DESC` (reglas del usuario priority 5 > reglas seed priority 4)
   - `matchCount DESC` (desempate por frecuencia de uso)

### Presupuestos por Categoría (`RULE_BUDGETS`)

```javascript
const RULE_BUDGETS = {
    INSTRUCCIONES: { maxRules: 5, maxChars: 2500 },
    EJEMPLOS_SQL:  { maxRules: 5, maxChars: 3500 }
};
```

### Comportamiento de Truncación

```
Para cada categoría:
  1. Toma reglas en orden de prioridad
  2. Si la regla cabe completa → la incluye
  3. Si la regla NO cabe completa → la TRUNCA al espacio restante
  4. Después de truncar → no acepta más reglas
  5. NUNCA se salta una regla sin incluir al menos una parte
```

**⚠️ CLAVE:** Las reglas se truncan, nunca se saltan por completo. Esto garantiza que al menos contenido parcial esté presente.

### Ejemplo práctico

```
Pregunta: "ventas de pollo hoy"
Keywords extraídos: ["ventas", "pollo", "hoy"]

Reglas encontradas para INSTRUCCIONES:
  1. instrucciones_sistema (priority 10, keywords match: "ventas") → 1200 chars ✓
  2. regla_usuario_pollo (priority 5, content match: "pollo") → 800 chars ✓
  Total: 2000/2500 chars

Reglas encontradas para EJEMPLOS_SQL:
  1. ejemplos_ventas_basicas (priority 4, keywords match: "ventas,hoy") → 2100 chars ✓
  2. ejemplos_productos (priority 4, content match: "pollo") → 1800 chars → truncado a 1400 chars
  Total: 3500/3500 chars
```

---

## 5. Validador SQL (`sqlValidator.js`)

Red de seguridad post-procesamiento. Corrige errores comunes del LLM **antes** de ejecutar contra MySQL.

### Pipeline de validación (en orden):

#### 1. Limpieza general
- Quita espacios, backticks de markdown (` ```sql ` y ` ``` `)

#### 2. Whitelist de statements
```javascript
const allowedStarts = ['SELECT', 'SHOW', 'DESCRIBE', 'WITH'];
```
- Si el SQL no empieza con uno de estos → **RECHAZADO**

#### 3. Blacklist de comandos peligrosos
```javascript
const blacklist = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
    'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL',
    'INTO OUTFILE', 'INTO DUMPFILE', 'LOAD_FILE'
];
```
- Búsqueda con regex `\bPALABRA\b` (word boundary) → **RECHAZADO** si encuentra alguno

#### 4. Anti-inyección
- Detecta múltiples statements (`;` seguido de más texto) → **RECHAZADO**

#### 5a. Auto-fix: TIME() BETWEEN → HOUR()
```javascript
// Detecta: TIME(p.fecha) BETWEEN '09:00:00' AND '17:00:00'
// Reemplaza por: HOUR(p.fecha) >= 9 AND HOUR(p.fecha) < 17
const timePattern = /TIME\((\w+\.?\w+)\)\s+BETWEEN\s+'(\d{2}):\d{2}:\d{2}'\s+AND\s+'?(\d{2}):\d{2}:\d{2}'?/gi;
```
- **¿Por qué?** Llama 3.1:8b genera `TIME() BETWEEN` frecuentemente aunque se le diga que no. Esta corrección automática lo soluciona.

#### 5b. Auto-fix: Comillas sin cerrar
```javascript
// Cuenta comillas simples. Si son impares → busca la última y cierra antes del siguiente keyword SQL
const singleQuoteCount = (cleanSQL.match(/'/g) || []).length;
if (singleQuoteCount % 2 !== 0) { /* cierra la comilla */ }
```

#### 5c. Corrección de nombres de tablas incorrectos
```javascript
const commonWrongTables = [
    { wrong: 'lineas_pedido',  correct: 'lin_pedidos' },
    { wrong: 'linea_pedido',   correct: 'lin_pedidos' },
    { wrong: 'lineas_pedidos', correct: 'lin_pedidos' },
    { wrong: 'productos',      correct: 'items' },
    { wrong: 'producto',       correct: 'items' },
    { wrong: 'lineas_factura', correct: 'lin_facturas' },
    { wrong: 'linea_factura',  correct: 'lin_facturas' }
];
```
- **Solo verifica en cláusulas FROM y JOIN** (regex: `/\b(FROM|JOIN)\s+(\w+)/gi`)
- Si encuentra un nombre incorrecto → **RECHAZA** con mensaje indicando el nombre correcto

#### 5d. Verificación de sintaxis SQLite
- Detecta `DATE('now')` → **RECHAZADO** con mensaje de usar `CURDATE()`

#### 6. Protección LIMIT
- Si es `SELECT` y no tiene `LIMIT` → agrega `LIMIT 1000` automáticamente

---

## 6. Configuración de Ollama (`aiService.js` + `.env`)

### Variables de entorno (archivo `.env`):

| Variable | Valor Default | Descripción |
|---|---|---|
| `AI_PROVIDER` | `ollama` | Proveedor: `ollama` o `openrouter` |
| `OLLAMA_URL` | `http://localhost:11434/api/chat` | URL de la API de Ollama |
| `OLLAMA_MODEL` | `llama3.1:8b` | Modelo a usar |
| `OLLAMA_NUM_CTX` | `8192` | Ventana de contexto en tokens |
| `OLLAMA_TEMPERATURE` | `0.1` | Creatividad (0.1 = muy determinístico, ideal para SQL) |
| `OLLAMA_NUM_PREDICT` | `500` | Máximo tokens de respuesta |

### Parámetros hardcodeados en `aiService.js`:

```javascript
options: {
    num_ctx: parseInt(process.env.OLLAMA_NUM_CTX) || 8192,
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.1,
    num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT) || 500,
    top_p: 0.9,           // Nucleus sampling (no configurable por env)
    repeat_penalty: 1.1   // Penalización por repetición (no configurable por env)
}
```

### ⚠️ Consideraciones:
- **Temperature 0.1** es crítica para SQL — valores altos generan SQL creativo pero roto
- **num_ctx 8192** define el límite total de tokens. El `TOTAL_BUDGET = 7000 chars` en `promptBuilder.js` está calibrado para esto
- **Timeout:** 120 segundos (`{ timeout: 120000 }`)
- **Stream:** desactivado (`stream: false`) — espera respuesta completa

### Proveedor alternativo: OpenRouter
Si `AI_PROVIDER=openrouter`, usa la API de OpenRouter con modelo configurable:
```
OPENROUTER_API_KEY=tu_key
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct
```

---

## 7. Cómo Agregar Reglas desde la UI

Las reglas se gestionan desde la página `/rules.html` y se almacenan en la tabla `ContextRules`.

### Mejores prácticas:

1. **Máximo 7 ejemplos por regla** — Calidad > cantidad. Con 4-6 ejemplos bien escritos es suficiente.

2. **Cada ejemplo cubre un patrón DIFERENTE:**
   ```
   ✅ BUENO (patrones distintos):
   - Ventas del día
   - Ventas de la semana
   - Ventas por producto
   - Ventas por cliente
   
   ❌ MALO (patrones repetidos):
   - Ventas del lunes
   - Ventas del martes
   - Ventas del miércoles
   ```

3. **Keywords significativos:** Usa palabras que aparecerán en las preguntas del usuario:
   ```
   keywords: "ventas,pedidos,productos,hoy,ayer,mes"
   ```

4. **Prioridad:**
   - Reglas seed (del sistema): `priority = 4` o `priority = 10`
   - Reglas del usuario (desde UI): `priority = 5` por defecto
   - **Mayor prioridad = se incluye primero** en el presupuesto

5. **Presupuesto total de EJEMPLOS_SQL:** 3500 chars máximo. Si tienes muchas reglas, las de menor prioridad se truncarán.

6. **Formato de cada ejemplo:**
   ```
   Pregunta: [pregunta en lenguaje natural]
   SQL: [query SQL correcta y completa]
   ```
   Separar ejemplos con `---`

7. **Para INSTRUCCIONES:** Escribe reglas imperativas, claras y específicas:
   ```
   ✅ "La tabla de productos se llama 'items', NO 'productos'"
   ✅ "Para ventas usa: pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id"
   ❌ "Las tablas tienen nombres especiales" (demasiado vago)
   ```

---

## 8. Errores Comunes y Soluciones

### 🔴 La IA usa tablas incorrectas (ej: `productos` en vez de `items`, `combos`)

**Causa:** El modelo no leyó las instrucciones o inventó nombres.  
**Solución:**
1. Agregar regla tipo `INSTRUCCIONES` con texto explícito:
   ```
   NO uses la tabla 'productos' — la tabla correcta es 'items'
   NO uses combos ni lin_facturas para ventas — usa pedidos y lin_pedidos
   ```
2. Verificar que la regla tiene `keywords` que coincidan con la pregunta
3. El `sqlValidator.js` también tiene `commonWrongTables` como red de seguridad

### 🔴 La IA genera `TIME(p.fecha) BETWEEN '09:00:00' AND '17:00:00'`

**Causa:** Patrón muy arraigado en el entrenamiento del modelo base.  
**Solución triple:**
1. Regla #5 hardcodeada: `"Para filtrar por HORA usa: HOUR(p.fecha) >= X AND HOUR(p.fecha) < Y. NUNCA uses TIME() BETWEEN"`
2. `sqlValidator.js` auto-reemplaza `TIME() BETWEEN` → `HOUR() >= AND HOUR() <`
3. Agregar ejemplo explícito en `EJEMPLOS_SQL` mostrando el patrón correcto

### 🔴 Comillas sin cerrar en el SQL generado

**Causa:** Error común en LLMs al generar strings.  
**Solución:** `sqlValidator.js` detecta comillas impares y las cierra automáticamente antes del siguiente keyword SQL.

### 🔴 Las reglas no se encuentran por smart matching

**Causa posible:** El campo `keywords` no coincide con las palabras de la pregunta.  
**Diagnóstico:**
1. Revisar log `🎯 Smart Context Rules Budget:` — si dice `0/N rules`, las keywords no coinciden
2. El content matching (palabras > 3 chars) es el fallback automático
3. Reglas con `keywords = null` o vacío → siempre se incluyen (legacy)

**Solución:** Agregar keywords relevantes al campo `keywords` de la regla.

### 🔴 Reglas saltadas por presupuesto

**Realidad:** Las reglas NUNCA se saltan completamente. Se **truncan** al espacio disponible.  
**Si crees que falta contenido:**
1. Revisar log `⚠️ [CATEGORÍA]: Rule "key" truncated from X to Y chars`
2. Subir la prioridad de la regla (ej: de 4 a 6)
3. Reducir el contenido de otras reglas de menor prioridad

### 🔴 La IA alucina completamente (SQL sin sentido)

**Diagnóstico crítico:** Revisar los logs del servidor:
```
=== SQL PROMPT DEBUG ===
Instrucciones: 0 chars NONE    ← ❌ PROBLEMA: No se cargaron instrucciones
Examples: 0 chars NONE          ← ❌ PROBLEMA: No se cargaron ejemplos
```

**Si ambos están en 0:**
- Las reglas no existen en la BD → ejecutar seed: `node seeds/initialRules.js`
- La BD de memoria no está conectada → verificar variables `MEM_DB_*` en `.env`
- El smart matching falló y el fallback también → revisar logs de error anteriores

### 🔴 La IA usa `DATE('now')` en vez de `CURDATE()`

**Causa:** Sintaxis SQLite confundida con MySQL.  
**Solución:**
1. Regla #2 hardcodeada lo prohíbe
2. `sqlValidator.js` detecta `DATE('now')` y rechaza con mensaje claro

---

## 9. Archivos Críticos (NO modificar sin entender)

| Archivo | Rol | ⚠️ Si lo modificas mal... |
|---|---|---|
| `services/promptBuilder.js` | Construye el prompt para SQL y las demás interacciones | Se rompe la generación SQL. Cambiar el orden de las secciones puede degradar la calidad drásticamente. El `TOTAL_BUDGET` está calibrado para 8192 tokens. |
| `services/memoryManager.js` | Smart matching de reglas, cache SQL, preferencias | Se rompe la selección de reglas contextuales. `RULE_BUDGETS` controla cuánto entra al prompt. |
| `services/sqlValidator.js` | Validación, limpieza y auto-fix de SQL | Se pierde la red de seguridad. Sin esto, SQL peligroso o roto llega a MySQL. |
| `services/aiService.js` | Comunicación con Ollama/OpenRouter | Se rompe toda la IA. Los `options` (temperature, num_ctx) afectan calidad del SQL. |
| `services/embeddingService.js` | Extracción de keywords y similitud de texto | Se rompe el smart matching. `extractKeywords()` es usado por memoryManager y el cache. |
| `services/dbManager.js` | Conexión MySQL, ejecución SQL, extracción de schema | Se rompe la ejecución. `extractSchemaForPrompt()` genera el schema dinámico con cache de 5 min. |
| `controllers/chatController.js` | Orquesta todo el flujo de chat | Es el "main". Cambiar el orden de los pasos rompe la lógica completa. |
| `seeds/initialRules.js` | Reglas seed iniciales (upsert por key) | Son la base del "entrenamiento". Sin estas reglas, la IA no sabe qué tablas existen. |
| `models/ContextRule.js` | Modelo Sequelize de reglas | Cambiar campos rompe las queries de memoryManager. `category` tiene validación `isIn`. |
| `.env` | Variables de entorno | `OLLAMA_MODEL`, `OLLAMA_NUM_CTX`, `OLLAMA_TEMPERATURE` afectan directamente la calidad del SQL. |

---

## 10. Logs de Debug

### Marcadores de log en la consola del servidor:

| Marcador | Archivo | Qué muestra |
|---|---|---|
| `🎯 Smart Context Rules Budget:` | `memoryManager.js` | Reglas seleccionadas por categoría, cantidad y chars usados. Keywords detectados. |
| `⚠️ [CAT]: Rule "key" truncated from X to Y chars` | `memoryManager.js` | Una regla fue truncada para caber en el presupuesto. |
| `=== SQL PROMPT DEBUG ===` | `promptBuilder.js` | Tamaño total del prompt, tamaño de cada sección (Role, Instrucciones, Rules, Examples, Schema), fuente del schema. |
| `=== DYNAMIC SCHEMA DEBUG ===` | `chatController.js` | Si el schema se extrajo, su tamaño y preview de los primeros 300 chars. |
| `=== DB CONFIG DEBUG ===` | `chatController.js` | ID y nombre de la conexión, si usa schema dinámico o descripción. |
| `=== IA RESPONSE DEBUG ===` | `chatController.js` | Respuesta cruda de la IA (el SQL generado antes de validar). |
| `🔧 SQL Fix:` | `sqlValidator.js` | Correcciones automáticas aplicadas (TIME→HOUR, comillas cerradas). |
| `⚠️ Prompt exceeds budget:` | `promptBuilder.js` | El prompt excedió 7000 chars. Muestra tamaño antes y después de recortar. |
| `⚡ SQL Cache HIT (exact/similarity):` | `memoryManager.js` | Se encontró SQL en cache (exacto o por similitud). |
| `🔍 SQL Cache MISS:` | `memoryManager.js` | No se encontró cache, se generará SQL nuevo. |
| `💾 SQL Cache SAVE:` | `memoryManager.js` | SQL exitoso guardado en cache. |
| `📋 Schema cache HIT for DB X` | `dbManager.js` | Schema servido desde cache (TTL 5 min). |
| `📋 Schema extracted for DB X:` | `dbManager.js` | Schema extraído de MySQL, N tablas, M chars. |
| `🎯 Intención detectada:` | `chatController.js` | Resultado del clasificador: DATABASE o GENERAL. |

### Flujo de debug típico para diagnosticar SQL incorrecto:

```
1. Buscar: "🎯 Intención detectada: DATABASE"        → ¿Se clasificó correctamente?
2. Buscar: "🎯 Smart Context Rules Budget:"           → ¿Se cargaron reglas? ¿Cuántas?
3. Buscar: "=== SQL PROMPT DEBUG ==="                 → ¿Instrucciones y Examples tienen chars > 0?
4. Buscar: "=== IA RESPONSE DEBUG ==="                → ¿Qué SQL generó la IA?
5. Buscar: "🔧 SQL Fix:"                              → ¿Se aplicaron correcciones?
6. Buscar: "=== SQL EXECUTION ERROR ==="              → ¿MySQL rechazó la query?
```

---

## Resumen Rápido: Dónde Modificar Cada Cosa

| Quiero... | Modificar archivo |
|---|---|
| Agregar reglas/ejemplos SQL | UI `/rules.html` o `seeds/initialRules.js` |
| Cambiar el orden del prompt | `services/promptBuilder.js` → `buildSQLPrompt()` |
| Cambiar presupuestos de reglas | `services/memoryManager.js` → `RULE_BUDGETS` |
| Cambiar presupuesto total del prompt | `services/promptBuilder.js` → `TOTAL_BUDGET` |
| Agregar corrección automática de SQL | `services/sqlValidator.js` → sección 5 |
| Cambiar modelo o parámetros de IA | `.env` o `services/aiService.js` |
| Cambiar extracción de keywords | `services/embeddingService.js` → `extractKeywords()` |
| Cambiar schema dinámico | `services/dbManager.js` → `extractSchemaForPrompt()` |
| Cambiar flujo completo del chat | `controllers/chatController.js` → `handleChat()` |
