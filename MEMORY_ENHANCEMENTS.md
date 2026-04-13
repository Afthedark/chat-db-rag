# 🧠 Sistema de Memoria Mejorado - Guía de Implementación

## Resumen

El sistema Chat DB RAG ahora cuenta con una **arquitectura de memoria avanzada en múltiples capas** que mejora significativamente la retención de contexto, el rendimiento de consultas y la experiencia del usuario.

---

## 🎯 Mejoras Implementadas

### ✅ Nivel 1: Victorias Rápidas (Completado)

#### **A. Expansión Dinámica del Historial**
- **Antes**: Límite fijo de 6 mensajes
- **Ahora**: Límite dinámico basado en longitud de conversación e intención
  - Intención DATABASE: 10-30 mensajes (escala con la conversación)
  - Intención GENERAL: 20-30 mensajes
- **Archivo**: `backend/controllers/chatController.js` (línea 60-63)
- **Servicio**: `backend/services/memoryManager.js` → `getDynamicHistoryLimit()`

#### **B. Índices de Base de Datos**
- **Agregados al modelo Message**:
  - Índice `chatId` (carga de historial más rápida)
  - Índice `createdAt` (consultas por tiempo)
  - Índice `role` (filtrado usuario/asistente)
  - Índice `databaseUsed` (analíticas)
- **Agregados al modelo ContextRule**:
  - Índices `category`, `isActive`, `priority`, `matchCount`
- **Agregados al modelo SQLCache**:
  - Índices `questionHash`, `databaseId`, `useCount`, `lastUsed`
- **Archivos**: `backend/models/Message.js`, `backend/models/ContextRule.js`, `backend/models/SQLCache.js`

#### **C. Caché de Consultas SQL**
- **Nueva Tabla**: `SQLCache`
- **Propósito**: Almacenar consultas SQL exitosas para evitar regenerarlas
- **Características**:
  - Coincidencia exacta mediante hash MD5
  - Búsqueda por similitud usando vectores de embedding
  - Conteo de uso y seguimiento de última ejecución
  - Almacenamiento de vista previa de resultados (primeras 5 filas)
- **Monitoreo**: Tasa de aciertos del caché
- **Archivos**:
  - `backend/models/SQLCache.js` (modelo)
  - `backend/services/memoryManager.js` → `checkSQLCache()`, `saveToSQLCache()`
  - `backend/controllers/chatController.js` (líneas 99-141)
- **Endpoints de API**:
  - `GET /api/cache/stats` - Ver estadísticas del caché
  - `POST /api/cache/clean` - Limpiar entradas viejas
  - `GET /api/cache/search?question=...&databaseId=...` - Buscar consultas similares

---

### ✅ Nivel 2: Mejoras Intermedias (Completado)

#### **D. Resumen de Conversaciones**
- **Disparador**: Cuando la conversación supera los 15 mensajes
- **Cómo funciona**:
  1. Mantiene intactos los últimos 10 mensajes
  2. Resume mensajes anteriores en puntos clave:
     - Bases de datos consultadas
     - Cantidad de consultas SQL ejecutadas
     - Temas discutidos (extracción de keywords)
     - Patrón de preguntas del usuario
  3. Inyecta el resumen en el prompt del sistema como contexto
- **Beneficios**:
  - Mantiene coherencia en conversaciones largas
  - Reduce uso de tokens
  - Preserva contexto importante sin historial completo
- **Archivo**: `backend/services/memoryManager.js` → `summarizeConversation()`
- **Integración**: `backend/controllers/chatController.js` (líneas 66-73)
- **Prompt Builder**: `backend/services/promptBuilder.js` → `buildGeneralChatPrompt()` ahora acepta parámetro `summary`

#### **E. Aprendizaje de Preferencias del Usuario**
- **Nueva Tabla**: `UserPreference`
- **Propósito**: Aprender y almacenar patrones del usuario con el tiempo
- **Preferencias Rastreadas**:
  - Temas/keywords de consultas frecuentes
  - Preferencias de base de datos
  - Preferencias de visualización
  - Patrones de comportamiento
- **Motor de Inferencia**:
  - Analiza últimos 10 mensajes por chat
  - Detecta keywords que aparecen 3+ veces
  - Asigna puntuaciones de confianza (0-1)
  - Actualiza contadores de frecuencia
- **Archivos**:
  - `backend/models/UserPreference.js` (modelo)
  - `backend/services/memoryManager.js` → `getPreference()`, `setPreference()`, `inferPreferences()`
  - `backend/controllers/chatController.js` (líneas 137, 243)
- **Endpoints de API**:
  - `GET /api/preferences` - Listar todas las preferencias
  - `GET /api/preferences/:key` - Obtener preferencia específica
  - `POST /api/preferences` - Crear/actualizar preferencia
  - `DELETE /api/preferences/:key` - Eliminar preferencia

#### **F. Reglas de Contexto Inteligentes con Matching por Keywords**
- **Modelo ContextRule Mejorado**:
  - Nuevos campos: `keywords` (separados por comas), `priority` (entero), `matchCount` (auto-incremento)
  - Nuevas categorías: `SCHEMA`, `FEW_SHOT` (además de las existentes)
  - **Auto-generación de keywords**: Si no se proporcionan, se extraen automáticamente del contenido
  - **Fallback inteligente**: Reglas sin keywords (legacy) siempre se incluyen
- **Recuperación Inteligente**:
  1. Extraer keywords de la pregunta del usuario
  2. Buscar reglas con keywords coincidentes
  3. Incluir reglas sin keywords (fallback automático)
  4. Ordenar por prioridad y matchCount
  5. Incrementar matchCount para reglas usadas
- **Beneficios**:
  - Reglas más relevantes por consulta
  - Auto-optimización (reglas populares suben)
  - Prompt más limpio y enfocado
  - Reglas antiguas siempre incluidas como respaldo
- **Archivos**:
  - `backend/models/ContextRule.js` (modelo mejorado)
  - `backend/services/memoryManager.js` → `getSmartContextRules()`
  - `backend/services/promptBuilder.js` → `buildSQLPrompt()` ahora usa reglas inteligentes
  - `backend/controllers/rulesController.js` (soporta nuevos campos + auto-keywords)
  - `backend/routes/rulesRoutes.js` (nuevos endpoints)

---

### ✅ Nivel 3: Características Avanzadas (Completado)

#### **G. Servicio de Embeddings para Similitud Vectorial**
- **Nuevo Servicio**: `backend/services/embeddingService.js`
- **Características**:
  - **Embeddings Ligeros**: Vectores de 64 dimensiones desde hashes SHA-256 (sin API externa)
  - **Similitud Coseno**: Comparación matemática de vectores
  - **Similitud de Texto**: Enfoque híbrido combinando:
    - Similitud Jaccard (superposición de palabras) - 40% peso
    - Superposición de keywords (matching semántico) - 60% peso
  - **Extracción de Keywords**: Filtrado de stop-words + análisis de frecuencia
  - **Búsqueda por Similitud**: Encontrar preguntas en caché similares a la actual
- **Uso**:
  - Matching de similitud en SQL Cache
  - Almacenamiento de embedding en mensajes
  - Futuro: Búsqueda semántica en historial de conversaciones
- **Nota**: Esta es una aproximación ligera. Para producción, considerar embeddings de OpenAI o similar.

#### **H. Servicio Memory Manager**
- **Nuevo Servicio**: `backend/services/memoryManager.js`
- **Orquestación Central**:
  - Operaciones de caché SQL
  - Gestión de preferencias
  - Recuperación de contexto inteligente
  - Resumen de conversaciones
  - Límites dinámicos de historial
  - Utilidades de limpieza de caché
  - Seguimiento de estadísticas
- **Funciones de Utilidad**:
  - `cleanOldCache(days)` - Eliminar entradas obsoletas
  - `getCacheStats()` - Ver métricas de rendimiento del caché
  - `getDynamicHistoryLimit()` - Tamaño adaptativo del historial

#### **I. Scripts de Migración y Seed**
- **Nuevo Script**: `backend/seeds/enhancedMemoryMigration.js`
- **Qué hace**:
  1. Crea nuevas tablas (SQLCache, UserPreference)
  2. Actualiza tablas existentes (Message, ContextRule)
  3. Inserta reglas mejoradas con keywords y prioridades
  4. Inicializa preferencias por defecto
- **Ejecutar Migración**:
  ```bash
  cd backend
  npm run migrate:memory
  ```

#### **J. Auto-Población de Keywords para Reglas Existentes**
- **Nuevo Script**: `backend/seeds/populateRuleKeywords.js`
- **Propósito**: Generar automáticamente keywords para reglas antiguas que no los tienen
- **Endpoints de API**:
  - `POST /api/rules/populate-all-keywords` - Generar keywords para TODAS las reglas sin ellos
  - `POST /api/rules/:id/populate-keywords` - Generar keywords para una regla específica
- **Auto-generación automática**: Al crear/actualizar reglas por la UI sin keywords, se generan solos del contenido
- **Ejecutar Script**:
  ```bash
  cd backend
  npm run seed:keywords
  ```

---

## 📊 Resumen de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    PREGUNTA DEL USUARIO                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  Clasificador de        │
         │  Intención              │
         │  (DATABASE / GENERAL)   │
         └──────────┬──────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────┐        ┌───────────────┐
│  Flujo        │        │  Flujo        │
│  DATABASE     │        │  GENERAL      │
└───────┬───────┘        └───────┬───────┘
        │                        │
        ▼                        ▼
┌───────────────┐        ┌───────────────┐
│ Verificar     │        │ Resumen       │
│ Caché SQL     │        │ (si >15 msj)  │
└───────┬───────┘        └───────┬───────┘
        │                        │
   HIT  │  MISS                   │
   ┌────┴────┐                   │
   │         │                   │
   ▼         ▼                   ▼
Ejecutar  Generar SQL       Historial
Caché     (Reglas Smart)    Dinámico +
          + Embeddings      Contexto
        │
        ▼
┌───────────────┐
│ Guardar Cache │
│ + Preferencias│
└───────────────┘
```

---

## 🔄 Flujo Completo del Sistema RAG con Contexto Inteligente

```
Usuario: "Cuántas ventas hoy?"
        ↓
══════════ PASO 1: RETRIEVAL (búsqueda de contexto) ═══════════
        ↓
[1a] Extraer keywords de la pregunta
     → ["ventas", "hoy"]

[1b] Buscar reglas inteligentes:
     → Reglas con "ventas" en keywords ✅
     → Reglas con "hoy" en keywords ✅
     → Reglas SIN keywords (legacy) ✅ (fallback automático)

[1c] Obtener schema de la BD seleccionada
     → dbConfig.description (texto que describió el usuario)
        ↓
══════════ PASO 2: BUILD PROMPT (armar el prompt) ═══════════

El promptBuilder construye:

┌─────────────────────────────────────────────────────────┐
│ SYSTEM PROMPT                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Eres un experto en MySQL y analista de datos...         │
│                                                         │
│ ═══ INSTRUCCIONES ADICIONALES ═══                       │
│ (de reglas INSTRUCCIONES con matching de keywords       │
│  + reglas legacy sin keywords como fallback)            │
│                                                         │
│ ═══ ESTRUCTURA DE LA BASE DE DATOS ═══                  │
│ (viene de dbConfig.description - el schema)             │
│                                                         │
│ ═══ EJEMPLOS DE CONSULTAS (FEW-SHOT) ═══                │
│ (de reglas EJEMPLOS_SQL con matching de keywords        │
│  + ejemplos legacy como fallback)                       │
│                                                         │
│ ═══ REGLAS ESTRICTAS ═══                                │
│ (siempre incluidas, hardcoded)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ USER PROMPT                                             │
├─────────────────────────────────────────────────────────┤
│ Pregunta de usuario: Cuántas ventas hoy?                │
│ Genera el SQL usando EXACTAMENTE los nombres del        │
│ esquema.                                                │
└─────────────────────────────────────────────────────────┘
        ↓
══════════ PASO 3: IA GENERA SQL ═══════════
        ↓
══════════ PASO 4: VALIDACIÓN + EJECUCIÓN ═══════════
        ↓
══════════ PASO 5: RESPUESTA EN LENGUAJE NATURAL ═══════════
```

---

## 🚀 Instalación y Migración

### 1. Ejecutar Migración de Memoria

```bash
cd backend

# Opción 1: Usando script npm
npm run migrate:memory

# Opción 2: Ejecución directa
node seeds/enhancedMemoryMigration.js
```

### 2. Poblar Keywords en Reglas Existentes

```bash
cd backend

# Opción 1: Usando script npm
npm run seed:keywords

# Opción 2: Usando endpoint API (con servidor corriendo)
curl -X POST http://localhost:3000/api/rules/populate-all-keywords
```

### 3. Reiniciar Servidor

```bash
npm run dev
```

### 4. Verificar Nuevas Características

```bash
# Ver estadísticas del caché
curl http://localhost:3000/api/cache/stats

# Ver preferencias
curl http://localhost:3000/api/preferences

# Ver reglas ordenadas por matchCount
curl http://localhost:3000/api/rules?sortBy=matchCount

# Probar reglas inteligentes (keywords deben coincidir)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Cuántas ventas hoy?", "targetDbId": 1}'
```

---

## 📈 Mejoras de Rendimiento Esperadas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Contexto del Historial** | 6 mensajes fijos | 10-30 dinámicos | +67-400% |
| **Consultas Repetidas** | Generación IA cada vez | Caché hit (instantáneo) | -90% llamadas IA |
| **Conversaciones Largas** | Pérdida de contexto tras 6 msj | Resumen a los 15+ | Mejor coherencia |
| **Relevancia de Reglas** | Todas las reglas siempre | Solo con matching de keywords + fallback legacy | Mayor precisión SQL |
| **Preferencias del Usuario** | Ninguna | Aprendidas automáticamente | Experiencia personalizada |
| **Velocidad de Consultas BD** | Sin índices | 4+ índices por tabla | 2-5x más rápido |
| **Prompt Size** | 5000+ chars (todas las reglas) | 1500-2500 chars (solo relevantes) | -50-70% tokens |

---

## 🔧 Nuevos Endpoints de API

### Gestión de Caché

```bash
# Obtener estadísticas del caché
GET /api/cache/stats
Respuesta: { success: true, data: { totalEntries, totalUses, avgSimilarity, hitRate } }

# Limpiar entradas viejas del caché
POST /api/cache/clean
Cuerpo: { daysOld: 30 }
Respuesta: { success: true, message: "Removed X old cache entries", deleted: X }

# Buscar preguntas similares en caché
GET /api/cache/search?question=ventas&databaseId=1&threshold=0.5
Respuesta: { success: true, data: [...], count: X }
```

### Gestión de Preferencias

```bash
# Listar todas las preferencias
GET /api/preferences?category=database
Respuesta: { success: true, data: [...] }

# Obtener preferencia específica
GET /api/preferences/default_history_limit
Respuesta: { success: true, data: {...} }

# Crear/actualizar preferencia
POST /api/preferences
Cuerpo: { key: "mi_pref", category: "behavior", value: "data", confidence: 0.8 }
Respuesta: { success: true, message: "Preference 'mi_pref' saved successfully" }

# Eliminar preferencia
DELETE /api/preferences/mi_pref
Respuesta: { success: true, message: "Preference 'mi_pref' deleted" }
```

### Gestión Mejorada de Reglas

```bash
# Filtrar por estado activo y ordenar
GET /api/rules?isActive=true&sortBy=priority
GET /api/rules?category=EJEMPLOS_SQL&sortBy=matchCount

# Crear regla con keywords y prioridad (se auto-generan si no se proporcionan)
POST /api/rules
Cuerpo: {
  key: "mi_regla",
  category: "INSTRUCCIONES",
  content: "...",
  isActive: true,
  keywords: "ventas,pedidos,hoy",
  priority: 5
}

# Generar keywords automáticamente para TODAS las reglas sin ellos
POST /api/rules/populate-all-keywords
Respuesta: { success: true, message: "Keywords generated for X rules", updated: X }

# Generar keywords para una regla específica
POST /api/rules/3/populate-keywords
Respuesta: { success: true, message: "Keywords generated successfully", keywords: "ventas,hoy,..." }
```

### Utilidades del Sistema

```bash
# Limpieza de caché (endpoint del sistema)
POST /api/system/cache/cleanup
Respuesta: { success: true, message: "Cleaned X old cache entries" }
```

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Consulta por Primera Vez (Cache Miss)

```
Usuario: "Cuántas ventas hubo hoy?"
→ Verificación de caché: MISS
→ Generar SQL con IA
→ Ejecutar consulta
→ Guardar en caché
→ Devolver respuesta

La respuesta incluye: fromCache: false
```

### Ejemplo 2: Consulta Similar (Cache Hit)

```
Usuario: "Cuántas ventas hubo hoy?" (o similar)
→ Verificación de caché: HIT (similitud > 0.5)
→ Ejecutar SQL cacheado directamente
→ Saltar generación con IA
→ Devolver respuesta (mucho más rápido)

La respuesta incluye: fromCache: true
```

### Ejemplo 3: Conversación Larga (Resumen)

```
Usuario: (después de 20 mensajes) "De qué estábamos hablando?"
→ Límite de historial: 25 (dinámico)
→ 15+ mensajes anteriores resumidos
→ Resumen inyectado en el prompt
→ IA responde con conciencia del contexto
```

### Ejemplo 4: Aprendizaje de Patrones (Preferencias)

```
Usuario: (pregunta sobre "ventas" 5 veces en un chat)
→ Sistema infiere interés en "ventas"
→ Guarda preferencia: chat_123_interests = {keywords: ["ventas", "hoy", "total"]}
→ Futuros chats pueden usar esta preferencia
```

### Ejemplo 5: Reglas Inteligentes con Auto-Keywords

```
Usuario crea regla por UI:
  Contenido: "Excluir pedidos ANULADOS siempre..."
  Keywords: (vacío, no los puso)
  → Sistema auto-genera: "excluir,pedidos,anulados,siempre,where,estado"
  → Regla ahora se encuentra cuando pregunta sobre "pedidos" o "anulados"

Usuario pregunta: "pedidos de hoy?"
  → Keywords extraídos: ["pedidos", "hoy"]
  → Regla con "pedidos" en keywords → ENCONTRADA ✅
  → Regla sin keywords (legacy) → INCLUIDA ✅ (fallback)
  → Prompt más limpio, solo reglas relevantes
```

---

## 🧪 Pruebas de las Mejoras

### Probar Caché SQL

```bash
# Primera consulta (debe fallar caché)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Total de ventas hoy", "targetDbId": 1}'

# Misma consulta de nuevo (debe acertar caché)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Total de ventas hoy", "targetDbId": 1}'

# Ver estadísticas del caché
curl http://localhost:3000/api/cache/stats
```

### Probar Reglas Inteligentes

```bash
# Crear regla con keywords
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test_smart_rule",
    "category": "EJEMPLOS_SQL",
    "content": "SELECT * FROM test;",
    "isActive": true,
    "keywords": "test,ejemplo,demo",
    "priority": 5
  }'

# Consulta con keywords coincidentes debe cargar esta regla
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Muéstrame un ejemplo test", "targetDbId": 1}'

# Generar keywords para reglas existentes
curl -X POST http://localhost:3000/api/rules/populate-all-keywords
```

### Probar Resumen

```bash
# Enviar 20+ mensajes en un chat
# Luego preguntar sobre contexto anterior
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Qué consultamos antes?", "historyId": 1, "targetDbId": 1}'

# La IA debe responder con conciencia de temas anteriores
```

---

## 🔮 Mejoras Futuras (No Implementadas Aún)

- [ ] Embeddings reales vía API de OpenAI o modelo local
- [ ] Integración con base de datos vectorial (Qdrant, Pinecone)
- [ ] Memoria de grafo para relaciones entre entidades
- [ ] Compartir contexto entre chats diferentes
- [ ] Aprendizaje de patrones temporales
- [ ] Generación automática de reglas desde consultas exitosas
- [ ] UI de preferencias de usuario en el frontend

---

## 📝 Notas

1. **Compatibilidad Hacia Atrás**: Todos los cambios son compatibles. Chats y mensajes existentes continúan funcionando.
2. **Degradación Elegante**: Si el caché o preferencias fallan, el sistema vuelve al comportamiento original.
3. **Rendimiento**: Los índices aceleran significativamente las consultas con conjuntos de datos grandes.
4. **Almacenamiento**: Las nuevas tablas agregan ~5-10MB por cada 10k conversaciones (manejable para la mayoría de casos).
5. **Privacidad**: Los embeddings son locales y ligeros. No se requieren llamadas a APIs externas.
6. **Auto-Keywords**: Las reglas creadas sin keywords generan automáticamente desde el contenido.
7. **Fallback Inteligente**: Reglas legacy sin keywords siempre se incluyen como respaldo.

---

## 🐛 Solución de Problemas

### La migración falla

```bash
# Verificar conexión a base de datos
cat backend/.env | grep MEM_DB

# Verificar que MySQL está corriendo
mysql -u root -p -e "SHOW DATABASES;"

# Reintentar migración
npm run migrate:memory
```

### El caché no funciona

```bash
# Verificar que la tabla SQLCache existe
mysql -u root -p ai_memory_db -e "SHOW TABLES;"

# Verificar que las rutas del caché están cargadas
curl http://localhost:3000/api/cache/stats
```

### Las reglas inteligentes no coinciden

```bash
# Verificar si las reglas tienen keywords
mysql -u root -p ai_memory_db -e "SELECT id, key, keywords FROM ContextRules;"

# Generar keywords para todas las reglas sin ellos
curl -X POST http://localhost:3000/api/rules/populate-all-keywords

# O ejecutar script
npm run seed:keywords

# Ver reglas ordenadas por coincidencias
curl http://localhost:3000/api/rules?sortBy=matchCount
```

### La IA no usa las reglas

```bash
# Verificar que las reglas están activas
mysql -u root -p ai_memory_db -e "SELECT id, key, isActive FROM ContextRules;"

# Ver logs del servidor cuando haces una pregunta
# Deberías ver:
# 🎯 Smart Context: Retrieved X rules for keywords: ...
# === SQL PROMPT DEBUG ===
# System Prompt Length: XXXX  (si es >2000, las reglas se están enviando)
```

---

## 📚 Archivos Modificados/Creados

### Nuevos Archivos (13)
- `backend/models/SQLCache.js`
- `backend/models/UserPreference.js`
- `backend/services/embeddingService.js`
- `backend/services/memoryManager.js`
- `backend/routes/cacheRoutes.js`
- `backend/routes/preferenceRoutes.js`
- `backend/seeds/enhancedMemoryMigration.js`
- `backend/seeds/populateRuleKeywords.js`
- `MEMORY_ENHANCEMENTS.md` (este archivo)

### Archivos Modificados (10)
- `backend/models/index.js` (agregados nuevos modelos)
- `backend/models/Message.js` (agregados índices, campos)
- `backend/models/ContextRule.js` (agregados keywords, priority, índices)
- `backend/services/promptBuilder.js` (reglas inteligentes, resumen)
- `backend/services/memoryManager.js` (fallback inteligente para reglas legacy)
- `backend/controllers/chatController.js` (todas las características de memoria)
- `backend/controllers/rulesController.js` (soporte de keywords/prioridad + auto-generación)
- `backend/routes/rulesRoutes.js` (nuevos endpoints de auto-keywords)
- `backend/server.js` (nuevas rutas)
- `backend/package.json` (scripts de migración y keywords)

---

## ✅ Lista de Implementación

- [x] Expansión dinámica del historial
- [x] Índices de base de datos en todos los modelos
- [x] Caché de consultas SQL con matching por similitud
- [x] Resumen de conversaciones
- [x] Aprendizaje de preferencias del usuario
- [x] Reglas de contexto inteligentes con keywords
- [x] Auto-generación de keywords desde contenido
- [x] Fallback inteligente para reglas legacy sin keywords
- [x] Servicio de embeddings (ligero)
- [x] Orquestación de Memory Manager
- [x] Scripts de migración y seed
- [x] Endpoints de API para caché y preferencias
- [x] Endpoints de API para auto-población de keywords
- [x] Controlador de reglas mejorado
- [x] Rutas del servidor actualizadas
- [x] Documentación

**¡Todas las mejoras completadas exitosamente! 🎉**
