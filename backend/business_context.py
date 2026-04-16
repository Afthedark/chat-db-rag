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
