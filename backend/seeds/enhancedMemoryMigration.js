/**
 * Migration Script: Enhanced Memory System
 * Adds new tables and updates existing ones for improved memory architecture
 */

const { sequelize, ContextRule, SQLCache, UserPreference } = require('../models');

const enhancedRulesSeed = [
    {
        key: 'instrucciones_sistema_v2',
        category: 'INSTRUCCIONES',
        content: `INSTRUCCIONES CRÍTICAS PARA GENERAR SQL:

1. USA EXACTAMENTE los nombres de tablas y columnas del esquema proporcionado en "ESTRUCTURA DE LA BASE DE DATOS"
2. Las tablas disponibles son ÚNICAMENTE: pedidos, lin_pedidos, items, clientes - NO uses otras tablas
3. NUNCA inventes nombres de tablas o columnas que no estén en el esquema
4. Para buscar productos usa: LOWER(i.descripcion) LIKE '%termino%'
5. Para cantidades usa: CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END
6. SIEMPRE excluye pedidos ANULADOS: WHERE p.estado != 'ANULADO'
7. JOINs OBLIGATORIOS: pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id
8. Puedes usar AS para dar nombres descriptivos a columnas (ej: i.descripcion AS nombre_producto)
9. La tabla de productos se llama "items", NO "productos"
10. La tabla de líneas de pedido se llama "lin_pedidos", NO "lineas_pedido"

REGLAS DE SEGURIDAD:
- Solo puedes generar sentencias de tipo SELECT o SHOW
- NUNCA uses INSERT, UPDATE, DELETE, DROP o cualquier comando que modifique datos
- No uses funciones de archivo como LOAD_FILE

FORMATO DE RESPUESTA:
- Responde ÚNICAMENTE con la consulta SQL requerida
- Sin explicaciones adicionales
- NO uses bloques de markdown (como \`\`\`sql ... \`\`\`)
- Devuelve solo la cadena SQL pura lista para ejecutarse`,
        isActive: true,
        keywords: 'ventas,pedidos,productos,clientes,consultas,sql',
        priority: 10,
        matchCount: 0
    },
    {
        key: 'ejemplos_pedidos_v2',
        category: 'EJEMPLOS_SQL',
        content: `Pregunta: ¿Cuántos pedidos hubo hoy?
SQL: SELECT COUNT(*) as total_pedidos FROM pedidos WHERE DATE(fecha) = CURDATE() AND estado != 'ANULADO';

---

Pregunta: Muéstrame el producto que más vendió y cuanto de ingresos generó
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) as producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END * lp.precio_unitario) as total_ingresos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY total_ingresos DESC LIMIT 1;

---

Pregunta: Total de ventas del mes actual
SQL: SELECT SUM(lp.total) as ventas_mes FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id WHERE p.estado != 'ANULADO' AND YEAR(p.fecha) = YEAR(CURDATE()) AND MONTH(p.fecha) = MONTH(CURDATE());

---

Pregunta: Top 5 clientes con más compras
SQL: SELECT c.nombre_razon_social as nombre, COUNT(p.pedido_id) as total_pedidos, SUM(p.total) as monto_total FROM clientes c JOIN pedidos p ON c.cliente_id = p.cliente_id WHERE p.estado != 'ANULADO' GROUP BY c.cliente_id, c.nombre_razon_social ORDER BY monto_total DESC LIMIT 5;

---

Pregunta: Productos sin ventas en los últimos 30 días
SQL: SELECT i.descripcion as producto FROM items i LEFT JOIN lin_pedidos lp ON i.item_id = lp.item_id LEFT JOIN pedidos p ON lp.pedido_id = p.pedido_id AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND p.estado != 'ANULADO' WHERE p.pedido_id IS NULL;

---

Pregunta: Busca productos que contengan "sanguchita"
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto_base, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_total FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND LOWER(i.descripcion) LIKE '%sanguchita%' GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', ''));`,
        isActive: true,
        keywords: 'ventas,hoy,mes,productos,clientes,top,pedidos,ingresos',
        priority: 8,
        matchCount: 0
    },
    {
        key: 'schema_ventas',
        category: 'SCHEMA',
        content: `=== ESTRUCTURA DE BASE DE DATOS ===

TABLA: pedidos
- pedido_id (INT, PK) - ID único del pedido
- fecha (DATETIME) - Fecha y hora del pedido
- estado (CHAR 15) - 'PENDIENTE', 'CONCLUIDO', 'ANULADO'
- total (DECIMAL 14,2) - Total del pedido

TABLA: lin_pedidos
- lin_pedido_id (INT, PK) - ID de la línea
- pedido_id (INT, FK) - Referencia a pedidos
- item_id (INT, FK) - Referencia a items
- cantidad (DECIMAL 14,2) - Cantidad base
- cant_total (DECIMAL 14,2) - Cantidad total (prioritaria)
- precio_unitario (DECIMAL 14,2) - Precio por unidad

TABLA: items
- item_id (INT, PK) - ID del producto
- descripcion (CHAR 150) - Nombre del producto
- precio_venta (DECIMAL 14,2) - Precio de venta

REGLAS IMPORTANTES:
- Excluir pedidos ANULADOS: WHERE estado != 'ANULADO'
- Para cantidades usar: CASE WHEN cant_total > 0 THEN cant_total ELSE cantidad END
- Productos "Para Llevar" tienen llevar=1 o (PLL) en descripción`,
        isActive: true,
        keywords: 'schema,estructura,tablas,pedidos,lin_pedidos,items',
        priority: 9,
        matchCount: 0
    }
];

const initialPreferences = [
    {
        preferenceKey: 'default_history_limit',
        category: 'database',
        value: JSON.stringify({ limit: 10, max: 30 }),
        frequency: 1,
        confidence: 0.8
    },
    {
        preferenceKey: 'cache_ttl_days',
        category: 'database',
        value: JSON.stringify({ days: 30 }),
        frequency: 1,
        confidence: 0.9
    },
    {
        preferenceKey: 'summary_threshold',
        category: 'behavior',
        value: JSON.stringify({ messages: 15, enabled: true }),
        frequency: 1,
        confidence: 0.85
    }
];

const runMigration = async () => {
    try {
        console.log('🚀 Starting Enhanced Memory System Migration...');
        
        // Verify connection
        await sequelize.authenticate();
        console.log('✅ Database connection verified');

        // Sync models (creates new tables and updates existing ones)
        await sequelize.sync({ alter: true });
        console.log('✅ Tables synchronized');

        // Seed enhanced context rules
        let rulesCreated = 0;
        for (const rule of enhancedRulesSeed) {
            const [record, created] = await ContextRule.findOrCreate({
                where: { key: rule.key },
                defaults: rule
            });
            if (created) {
                rulesCreated++;
                console.log(`  ✓ Created rule: ${rule.key}`);
            } else {
                console.log(`  ⚠ Rule already exists: ${rule.key}`);
            }
        }

        // Seed initial preferences
        let prefsCreated = 0;
        for (const pref of initialPreferences) {
            const [record, created] = await UserPreference.findOrCreate({
                where: { preferenceKey: pref.preferenceKey },
                defaults: pref
            });
            if (created) {
                prefsCreated++;
                console.log(`  ✓ Created preference: ${pref.preferenceKey}`);
            } else {
                console.log(`  ⚠ Preference already exists: ${pref.preferenceKey}`);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   - Rules created: ${rulesCreated}`);
        console.log(`   - Preferences created: ${prefsCreated}`);
        console.log(`   - New tables: SQLCache, UserPreference`);
        console.log(`   - Enhanced tables: Message (indexes, fields), ContextRule (keywords, priority)`);
        console.log('\n✅ Migration completed successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
};

runMigration();
