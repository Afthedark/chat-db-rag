# 📋 Guía de Preguntas para Chat-DB-RAG

## Índice
1. [Principios Fundamentales](#1-principios-fundamentales)
2. [Tipos de Preguntas Válidas](#2-tipos-de-preguntas-válidas)
3. [Preguntas Problemáticas y Reformulaciones](#3-preguntas-problemáticas-y-reformulaciones)
4. [Cómo Crear Nuevas Preguntas](#4-cómo-crear-nuevas-preguntas)
5. [Cómo Entrenar la IA](#5-cómo-entrenar-la-ia)
6. [Glosario de Términos](#6-glosario-de-términos)

---

## 1. Principios Fundamentales

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

## 2. Tipos de Preguntas Válidas

### 2.1 VENTAS Y TOTALES (solo números)

**Estructura:** "¿Cuál/Cuánto/Cuántas [métrica] de [período]?"

| Pregunta | Tipo de Respuesta |
|----------|-------------------|
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

### 2.2 PRODUCTOS MÁS VENDIDOS (listas con datos)

**Estructura:** "Dime los [N] [productos/items] más vendidos [período]"

| Pregunta | Tipo de Respuesta |
|----------|-------------------|
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

### 2.3 PRODUCTOS ESPECÍFICOS (consulta individual)

**Estructura:** "¿Cuánto/Cuántos [métrica] de [producto específico] [período]?"

| Pregunta | Tipo de Respuesta |
|----------|-------------------|
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

### 2.4 CATEGORÍAS DE PRODUCTOS

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

### 2.5 CONSULTAS POR TIEMPO (tendencias)

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

### 2.6 CLIENTES

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

### 2.7 EMPLEADOS Y CAJAS

**Ventas por empleado:**
- "¿Cuánto vendió cada empleado hoy?"
- "Ranking de ventas por cajero esta semana"
- "¿Quién atendió más pedidos ayer?"

**Por caja/turno:**
- "Ventas por caja número 1"
- "¿Cuánto se vendió en el turno de la mañana?"
- "Comparación de ventas por turno"

---

### 2.8 INVENTARIO Y ALMACÉN

**Stock:**
- "¿Qué productos tienen bajo stock?"
- "Lista de ítems con menos de 10 unidades"
- "Productos agotados"

**Movimientos:**
- "¿Qué productos entraron al almacén hoy?"
- "Salidas de inventario de la semana"
- "Movimientos de stock en marzo"

---

### 2.9 CONSULTAS DE ESTRUCTURA (metadata)

**Tablas:**
- "¿Qué tablas hay en la base de datos?"
- "Muéstrame la estructura de la tabla pedidos"
- "¿Qué columnas tiene la tabla items?"

**Relaciones:**
- "¿Cómo se relacionan pedidos y facturas?"
- "¿Qué campos tiene la tabla de clientes?"

---

## 3. Preguntas Problemáticas y Reformulaciones

### ❌ TIPO 1: Total + Lista (mezcla incompatible)

| ❌ NO FUNCIONA | ✅ REFORMULADA |
|---------------|----------------|
| "Ventas de marzo **y** productos más vendidos" | **"¿Cuál fue el total de ventas de marzo?"** (pregunta 1) + **"Dime los productos más vendidos en marzo"** (pregunta 2) |
| "Dime el total **y** el top 5 de productos" | Primero: "Total de ventas de hoy" → Luego: "Top 5 productos de hoy" |
| "¿Cuánto vendimos **y** qué se vendió más?" | Separar en dos preguntas |
| "Ventas del mes **con** detalle de productos" | "Total de ventas del mes" → "Productos vendidos este mes" |

**¿Por qué falla?** SQL no puede combinar un SELECT de 1 columna (total) con uno de 3 columnas (producto, cantidad, monto) usando UNION ALL.

---

### ❌ TIPO 2: Múltiples métricas incompatibles

| ❌ NO FUNCIONA | ✅ REFORMULADA |
|---------------|----------------|
| "Ventas, productos y clientes de hoy" | Tres preguntas separadas |
| "Dime todo: total, ranking, promedio" | Una por una |
| "¿Cómo estamos en ventas, stock y empleados?" | Dividir en consultas específicas |

---

### ❌ TIPO 3: Preguntas ambiguas

| ❌ AMBIGUA | ✅ ESPECÍFICA |
|-----------|---------------|
| "¿Cómo van las ventas?" | "¿Cuál fue el total de ventas de hoy?" |
| "¿Qué tal el mes?" | "¿Cuánto vendimos en marzo?" |
| "Dime los números" | "Dime el total de ventas y cantidad de pedidos" |
| "¿Qué pasó ayer?" | "¿Cuánto se vendió ayer?" |

---

### ❌ TIPO 4: Comparaciones complejas

| ❌ COMPLEJA | ✅ SIMPLE |
|------------|-----------|
| "Compara ventas de todos los meses del año con el año pasado" | "Ventas por mes en 2026" (luego manualmente comparas) |
| "Diferencia porcentual de ventas entre cada día de la semana" | "Ventas por día de la semana esta semana" |

---

## 4. Cómo Crear Nuevas Preguntas

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
|---------------------|---------------|
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

## 5. Cómo Entrenar la IA

### 5.1 Agregar Nuevas Reglas de Negocio

**Archivo:** `backend/business_context.py`

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

### 5.2 Agregar Términos al Glosario

**Archivo:** `backend/business_context.py` → `TABLE_GLOSSARY`

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

### 5.3 Agregar Ejemplos Few-Shot

**Archivo:** `backend/services/engine.py` → función `generate_sql()`

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

### 5.4 Agregar Palabras Clave de Negocio

**Archivo:** `backend/services/engine.py` → `BUSINESS_KEYWORDS`

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

### 5.5 Proceso para Agregar Nueva Funcionalidad

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

## 6. Glosario de Términos

### Términos de Negocio

| Término | Significado en el Sistema |
|---------|---------------------------|
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
|---------|-------------|
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

*Última actualización: Abril 2026*
*Para agregar nuevas preguntas o reglas, seguir el proceso de la sección 5*
