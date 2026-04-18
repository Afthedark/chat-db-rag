"""
Business context for pv_mchicken database.
Contains domain-specific rules, relationships and glossary injected into the LLM prompt.
"""

# ---------------------------------------------------------------------------
# Tables to EXCLUDE from the schema sent to the LLM.
# These are SIAT/fiscal parametric tables that add noise and waste context tokens.
# ---------------------------------------------------------------------------
EXCLUDED_TABLES = [
    # SIAT sync/parametric tables
    'sinc_actividades',
    'sinc_actividadesdocumentosectores',
    'sinc_leyendasfacturas',
    'sinc_mensajesservicios',
    'sinc_parametricaeventossignificativos',
    'sinc_parametricamotivoanulacions',
    'sinc_parametricapaisorigens',
    'sinc_parametricatipodocumentoidentidads',
    'sinc_parametricatipodocumentosectors',
    'sinc_parametricatipoemisions',
    'sinc_parametricatipohabitacions',
    'sinc_parametricatipometodopagos',
    'sinc_parametricatipomonedas',
    'sinc_parametricatipopuntoventas',
    'sinc_parametricatiposfacturas',
    'sinc_parametricaunidadmedidas',
    'sinc_productosservicios',
    'sinc_siat',
    # Fiscal/electronic invoice tables
    'cufds',
    'cuis',
    'cierreoperacionessistemas',
    'datossiatgenerales',
    'registroeventossignificativos',
    'registropuntoventas',
    'notificacertificadorevocados',
    'recepcionfacturas',
    'recepcionpaquetefacturas',
    'siat_consultas',
    # Internal/system tables
    'logs',
    'tokens',
    'tabla_local',
    'tabla_remota',
    'tablas_parametros',
    'gestiones',
    'secuencias',
    'actualizaciones',
    'link_sucursales',
]

# ---------------------------------------------------------------------------
# Business rules — injected verbatim into every SQL generation prompt
# ---------------------------------------------------------------------------
BUSINESS_RULES = """
=== CRITICAL BUSINESS RULES — Apply ALL of them in every query ===

RULE 1 — Valid sales only (MANDATORY):
  ALWAYS exclude cancelled orders:
  WHERE p.estado != 'ANULADO'   (or AND p.estado != 'ANULADO')

RULE 2 — Real product quantities (MANDATORY):
  In lin_pedidos, the column `cantidad` becomes 0 when the order is delivered.
  The original quantity is in `cant_total`.
  To count sold products you MUST use this formula:
  SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END)

RULE 3 — Unify takeout product variants (MANDATORY when grouping by product):
  Products ending in '(PLL)' are the takeout variant of the same product.
  When listing or grouping by product name, clean the name with:
  TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto

RULE 4 — Revenue calculation (choose the correct one):
  a) TOTAL revenue for a period (day / month / year):
     → Use SUM(p.total) directly from `pedidos`. Do NOT join with lin_pedidos.
  b) Revenue BROKEN DOWN BY PRODUCT:
     → Use SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END * lp.precio_unitario)
       from lin_pedidos joined with pedidos.

RULE 5 — Currency format (MANDATORY for money amounts):
  Always format monetary totals as: CONCAT(ROUND(SUM(...), 2), ' Bs')

RULE 6 — Time filters:
  The master time column is `p.fecha` in the `pedidos` table.
  Translate natural language dates (e.g. "12 de abril de 2026") to SQL date format ('2026-04-12').
  Use DATE(p.fecha), MONTH(p.fecha), YEAR(p.fecha), HOUR(p.fecha) as appropriate.
  The current date and yesterday are provided in the prompt context above.

RULE 7 — Time-based analysis (for hour/day/interval questions):
  Use HOUR(p.fecha) to extract hour (0-23) for peak hour analysis.
  Use DAYOFWEEK(p.fecha) for day of week: 1=Sunday, 7=Saturday.
  Use DAYNAME(p.fecha) to get day names ('Monday', 'Tuesday', etc.).
  Use DATE_FORMAT(p.fecha, '%H:00') for hourly intervals ('10:00', '11:00').
  For shift comparisons: HOUR(p.fecha) < 12 = Morning, >= 12 = Afternoon/Evening.
  For night sales: HOUR(p.fecha) >= 20 (after 8 PM).
  For lunch time analysis: HOUR(p.fecha) BETWEEN 12 AND 14.

RULE 7a — Custom time range filtering (for specific hour ranges):
  For "between X and Y" or "from X to Y": Use HOUR(p.fecha) >= X AND HOUR(p.fecha) < Y
  For "at X o'clock" or "during hour X": Use HOUR(p.fecha) = X
  For morning: HOUR(p.fecha) >= 6 AND HOUR(p.fecha) < 12
  For lunch hours: HOUR(p.fecha) >= 12 AND HOUR(p.fecha) < 14
  For afternoon: HOUR(p.fecha) >= 12 AND HOUR(p.fecha) < 18
  For evening/dinner: HOUR(p.fecha) >= 18 AND HOUR(p.fecha) < 21
  For night: HOUR(p.fecha) >= 20
  ALWAYS combine with date filter: DATE(p.fecha) = CURDATE() or specific date
  Example: DATE(p.fecha) = CURDATE() AND HOUR(p.fecha) >= 10 AND HOUR(p.fecha) < 14

RULE 8 — Product search patterns (for product-specific queries):
  ALWAYS use case-insensitive search: LOWER(i.descripcion) LIKE LOWER('%term%').
  ALWAYS unify PLL variants: TRIM(REPLACE(i.descripcion, '(PLL)', '')).
  Handle abbreviations: +P = con papas, Bñ/Bña = bañadas, pz = piezas, +Pep = con Pepsi.
  Handle typos: "Pollo" may be stored as "Polo" — use flexible LIKE patterns.

ORDER STATES for WHERE clauses:
  - Valid/sold:     p.estado = 'CONCLUIDO'  (or != 'ANULADO' to include PENDIENTE)
  - Cancelled:      p.estado = 'ANULADO'
  - In progress:    p.estado = 'PENDIENTE'
"""

# ---------------------------------------------------------------------------
# Table relationships — helps the LLM understand how to JOIN correctly
# ---------------------------------------------------------------------------
BUSINESS_RELATIONSHIPS = """
=== KEY TABLE RELATIONSHIPS ===

Main sales flow:
  pedidos (p)      → lin_pedidos (lp)  ON p.pedido_id = lp.pedido_id
  lin_pedidos (lp) → items (i)         ON lp.item_id = i.item_id
  items (i)        → grupo_productos   ON i.grupo_producto_id = grupo_productos.grupo_producto_id

Invoice flow (only invoiced sales):
  pedidos (p)      → facturas (f)      ON f.pedido_id = p.pedido_id
  facturas (f)     → lin_facturas (lf) ON lf.factura_id = f.factura_id

People:
  pedidos (p) → clientes (c)   ON p.cliente_id = c.cliente_id
  pedidos (p) → empleados (e)  ON p.empleado_id = e.empleado_id
  pedidos (p) → turnos (t)     ON p.turno_id = t.turno_id  (if turno_id exists)

Location:
  pedidos (p)  → almacenes    ON p.almacen_id = almacenes.almacen_id
  almacenes    → sucursales   ON almacenes.sucursal_id = sucursales.sucursal_id
"""

# ---------------------------------------------------------------------------
# Search glossary — how to translate user terms to SQL LIKE patterns
# ---------------------------------------------------------------------------
TABLE_GLOSSARY = """
=== PRODUCT SEARCH GLOSSARY (use LOWER() + LIKE) ===

User says "sándwich" or "sanguche"  → LOWER(i.descripcion) LIKE '%sanguchita%'
User says "bañada" or "bña"         → LOWER(i.descripcion) LIKE '%ba%ada%'
User says "con papas" or "+P"       → LOWER(i.descripcion) LIKE '%papas%'
User says "para llevar" or "PLL"    → lp.llevar = 1 OR i.descripcion LIKE '%(PLL)%'
User says "combo" or "mixto"        → i.mixto = 1

Always use case-insensitive search: LOWER(i.descripcion) LIKE LOWER('%term%')
"""

# ---------------------------------------------------------------------------
# Time-based analysis queries — for hour/day/interval analysis
# ---------------------------------------------------------------------------
TIME_ANALYSIS_QUERIES = """
=== TIME-BASED ANALYSIS SQL PATTERNS ===

PEAK HOUR (hora pico) — Hour with highest revenue and orders:
SELECT HOUR(p.fecha) AS hora_del_dia, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_totales, 
       COUNT(DISTINCT p.pedido_id) AS total_pedidos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' 
GROUP BY HOUR(p.fecha) 
ORDER BY ingresos_totales DESC LIMIT 1;

HOURLY SALES CURVE — Sales grouped by hour intervals:
SELECT DATE_FORMAT(p.fecha, '%H:00') AS intervalo_hora, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS productos_vendidos, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' 
GROUP BY DATE_FORMAT(p.fecha, '%H:00') 
ORDER BY intervalo_hora ASC;

MORNING vs AFTERNOON SHIFT:
SELECT CASE WHEN HOUR(p.fecha) < 12 THEN 'Mañana (antes 12:00)' ELSE 'Tarde/Noche (después 12:00)' END AS turno, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_totales 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' 
GROUP BY CASE WHEN HOUR(p.fecha) < 12 THEN 'Mañana (antes 12:00)' ELSE 'Tarde/Noche (después 12:00)' END;

TOP PRODUCTS DURING LUNCH TIME (12:00-14:59):
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND HOUR(p.fecha) BETWEEN 12 AND 14 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY cantidad_vendida DESC LIMIT 5;

WEEKDAY vs WEEKEND COMPARISON:
SELECT CASE WHEN DAYOFWEEK(p.fecha) IN (1, 7) THEN 'Fin de Semana (Sab/Dom)' ELSE 'Día de Semana (Lun-Vie)' END AS tipo_dia, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' 
GROUP BY CASE WHEN DAYOFWEEK(p.fecha) IN (1, 7) THEN 'Fin de Semana (Sab/Dom)' ELSE 'Día de Semana (Lun-Vie)' END;

BEST DAY OF WEEK (ordered by revenue):
SELECT DAYNAME(p.fecha) AS dia_semana, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_totales 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' 
GROUP BY DAYNAME(p.fecha), DAYOFWEEK(p.fecha) 
ORDER BY ingresos_totales DESC;

NIGHT SALES REPORT (after 20:00 / 8 PM):
SELECT DATE(p.fecha) AS fecha, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_nocturnos, 
       COUNT(DISTINCT p.pedido_id) AS cantidad_pedidos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' AND HOUR(p.fecha) >= 20 
GROUP BY DATE(p.fecha) 
ORDER BY fecha DESC;

AVERAGE TICKET BY HOUR:
SELECT HOUR(p.fecha) AS hora_del_dia, 
       ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) / COUNT(DISTINCT p.pedido_id), 2) AS ticket_promedio 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' 
GROUP BY HOUR(p.fecha) 
ORDER BY hora_del_dia ASC;

AVERAGE SERVICE TIME BY HOUR:
SELECT HOUR(p.fecha) AS hora_del_dia, 
       ROUND(AVG(TIMESTAMPDIFF(MINUTE, lp.hora_inicio, lp.hora_fin)), 2) AS tiempo_promedio_atencion_minutos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id 
WHERE p.estado != 'ANULADO' AND lp.hora_inicio IS NOT NULL AND lp.hora_fin IS NOT NULL 
GROUP BY HOUR(p.fecha) 
ORDER BY hora_del_dia ASC;

TIME FUNCTIONS REFERENCE:
- HOUR(p.fecha) — Extract hour (0-23)
- DAYOFWEEK(p.fecha) — 1=Sunday, 2=Monday, ..., 7=Saturday
- DAYNAME(p.fecha) — Returns 'Monday', 'Tuesday', etc.
- DATE_FORMAT(p.fecha, '%H:00') — Formats as '10:00', '11:00', etc.
- MONTH(p.fecha) — Extract month (1-12)
- YEAR(p.fecha) — Extract year

CUSTOM TIME RANGE QUERIES (for specific hour ranges):

Top products sold TODAY between 10:00 and 14:00 (10am-2pm):
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = CURDATE() 
  AND HOUR(p.fecha) >= 10 AND HOUR(p.fecha) < 14 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY cantidad_vendida DESC;

Products sold YESTERDAY at specific hour (9:00-10:00 am):
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
  AND HOUR(p.fecha) = 9 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY cantidad_vendida DESC;

Revenue by product on specific date + time range (3pm-5pm):
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_generados 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = '2026-04-15' 
  AND HOUR(p.fecha) >= 15 AND HOUR(p.fecha) < 17 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY ingresos_generados DESC;

Specific product sales in time range (Sanguchitas at lunch 12pm-2pm):
SELECT SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_sanguchitas 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = CURDATE() 
  AND HOUR(p.fecha) >= 12 AND HOUR(p.fecha) < 14 
  AND LOWER(i.descripcion) LIKE '%sanguchita%';

Top 3 products during dinner time (6pm-9pm) on specific date:
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = '2026-05-10' 
  AND HOUR(p.fecha) >= 18 AND HOUR(p.fecha) < 21 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY cantidad_vendida DESC LIMIT 3;

Morning shift report yesterday (8am-12pm) with quantity and revenue:
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_totales 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
  AND HOUR(p.fecha) >= 8 AND HOUR(p.fecha) < 12 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY ingresos_totales DESC;

TIME RANGE FILTERING RULES:
- For "between X and Y": Use HOUR(p.fecha) >= X AND HOUR(p.fecha) < Y
- For "at X o'clock": Use HOUR(p.fecha) = X
- For specific dates: Use DATE(p.fecha) = 'YYYY-MM-DD' or CURDATE() or DATE_SUB(CURDATE(), INTERVAL N DAY)
- Always combine date filter + hour filter for precise time ranges
- Common time ranges:
  * Morning: HOUR(p.fecha) >= 6 AND HOUR(p.fecha) < 12
  * Lunch: HOUR(p.fecha) >= 12 AND HOUR(p.fecha) < 14
  * Afternoon: HOUR(p.fecha) >= 12 AND HOUR(p.fecha) < 18
  * Evening: HOUR(p.fecha) >= 18 AND HOUR(p.fecha) < 21
  * Night: HOUR(p.fecha) >= 20
"""

# ---------------------------------------------------------------------------
# Product search rules — for flexible product searching
# ---------------------------------------------------------------------------
PRODUCT_SEARCH_RULES = """
=== PRODUCT SEARCH RULES (CRITICAL FOR PRODUCT QUERIES) ===

CASE-INSENSITIVE SEARCH:
User may type "SANGUCHITA", "sanguchita", or "SanGuChita".
ALWAYS use: LOWER(i.descripcion) LIKE LOWER('%search_term%')

UNIFY TAKEOUT VARIANTS (PLL):
Products ending in '(PLL)' are takeout variants of the same product.
When grouping/counting/summing by product, ALWAYS unify them:
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto_base, ...
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', ''))

ABBREVIATIONS GLOSSARY:
- (+P) or + P  → "Con Papas" (With Fries)
- Bñ or Bña    → "Bañadas" (e.g., Alitas bañadas)
- pz           → "piezas" (pieces)
- +Pep         → "Más Pepsi" (With Pepsi)

COMMON TYPO HANDLING:
- "Pollo al Horno" sometimes stored as "Polo al Horno"
- Use flexible LIKE: WHERE i.descripcion LIKE '%Horno%'

PRODUCT SEARCH EXAMPLES:

Total "Sanguchitas" sold (unifying local and takeout):
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto_base, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_total 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND LOWER(i.descripcion) LIKE '%sanguchita%' 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', ''));

Top 5 products of all time (unified PLL):
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto_base, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY cantidad_vendida DESC LIMIT 5;

Revenue from "bañados" products (Bñ/Bña):
SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto_banado, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_totales 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND (i.descripcion LIKE '%Bñ%' OR i.descripcion LIKE '%Bña%') 
GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) 
ORDER BY ingresos_totales DESC;

"Pollo al Horno" with typo handling:
SELECT i.descripcion AS producto_registrado, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND LOWER(i.descripcion) LIKE '%horno%' 
GROUP BY i.descripcion ORDER BY cantidad_vendida DESC;

Alitas by portion size (4pz, 6pz, 10pz):
SELECT CASE 
    WHEN i.descripcion LIKE '%4 pz%' THEN 'Alitas 4 pz' 
    WHEN i.descripcion LIKE '%6 pz%' THEN 'Alitas 6 pz' 
    WHEN i.descripcion LIKE '%10 pz%' THEN 'Alitas 10 pz' 
    ELSE 'Otras Alitas' 
END AS tamano_porcion, 
SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND LOWER(i.descripcion) LIKE '%alitas%' 
GROUP BY CASE 
    WHEN i.descripcion LIKE '%4 pz%' THEN 'Alitas 4 pz' 
    WHEN i.descripcion LIKE '%6 pz%' THEN 'Alitas 6 pz' 
    WHEN i.descripcion LIKE '%10 pz%' THEN 'Alitas 10 pz' 
    ELSE 'Otras Alitas' 
END;

Box Friends vs Box Wings comparison:
SELECT CASE 
    WHEN LOWER(i.descripcion) LIKE '%box friends%' THEN 'Familia Box Friends' 
    WHEN LOWER(i.descripcion) LIKE '%box wings%' THEN 'Familia Box Wings' 
END AS tipo_box, 
SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_total, 
SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_totales 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND (LOWER(i.descripcion) LIKE '%box friends%' OR LOWER(i.descripcion) LIKE '%box wings%') 
GROUP BY CASE 
    WHEN LOWER(i.descripcion) LIKE '%box friends%' THEN 'Familia Box Friends' 
    WHEN LOWER(i.descripcion) LIKE '%box wings%' THEN 'Familia Box Wings' 
END;

Exact product search (case-insensitive, unified PLL):
SELECT 'Pechuguita 5 (Todas las versiones)' as producto, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad, 
       SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND LOWER(TRIM(REPLACE(i.descripcion, '(PLL)', ''))) = 'pechuguita 5';

Products with Pepsi (+Pep):
SELECT i.descripcion, 
       SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' AND LOWER(i.descripcion) LIKE '%+pep%' 
  AND MONTH(p.fecha) = MONTH(CURDATE()) AND YEAR(p.fecha) = YEAR(CURDATE()) 
GROUP BY i.descripcion ORDER BY cantidad_vendida DESC;

Products with extra fries (+P) vs without:
SELECT CASE 
    WHEN i.descripcion LIKE '%+ P%' OR i.descripcion LIKE '%+P%' THEN 'Incluye Papas Extra' 
    ELSE 'Sin Papas Extra Indicadas' 
END AS categoria_papas, 
SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos 
FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id 
WHERE p.estado != 'ANULADO' 
GROUP BY CASE 
    WHEN i.descripcion LIKE '%+ P%' OR i.descripcion LIKE '%+P%' THEN 'Incluye Papas Extra' 
    ELSE 'Sin Papas Extra Indicadas' 
END;
"""
