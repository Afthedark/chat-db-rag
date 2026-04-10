const { sequelize, ContextRule } = require('../models');

const rulesSeed = [
    {
        key: 'instrucciones_sistema',
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
        isActive: true
    },
    {
        key: 'ejemplos_pedidos',
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
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto_base, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_total FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND LOWER(i.descripcion) LIKE '%sanguchita%' GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', ''));

---

Pregunta: Ventas de hoy agrupadas por producto
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad, SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = CURDATE() GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY ingresos DESC;

---

Pregunta: ¿Cuántas ventas hicimos ayer?
SQL: SELECT COUNT(DISTINCT p.pedido_id) as total_ventas, SUM(lp.total) as total_ingresos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY);

---

Pregunta: ¿Qué productos se vendieron poco ayer? (menos de 5 unidades)
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS nombre_producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) HAVING cantidad_vendida < 5 ORDER BY cantidad_vendida ASC;

---

Pregunta: Productos con bajas ventas ayer (menos de 3 vendidos)
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS nombre_producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) HAVING cantidad_vendida < 3 ORDER BY cantidad_vendida ASC;`,
        isActive: true
    }
];

const seedRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a BD Memoria verificada.');
        
        await sequelize.sync({ alter: true });
        console.log('Tablas sincronizadas.');

        let createdCount = 0;
        for (const rule of rulesSeed) {
            const [record, created] = await ContextRule.findOrCreate({
                where: { key: rule.key },
                defaults: rule
            });
            if (created) createdCount++;
        }

        console.log(`¡Seed Completado! Reglas creadas: ${createdCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Error insertando las reglas iniciales (seed):', error);
        process.exit(1);
    }
};

seedRules();
