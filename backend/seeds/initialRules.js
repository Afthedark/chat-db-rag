const { sequelize, ContextRule } = require('../models');

// NOTA: Si ya existen reglas con estas keys en la BD, la funcion seedRules
// las actualizara automaticamente con el nuevo contenido (upsert).
const rulesSeed = [
    {
        key: 'calculo_totales_ventas',
        category: 'INSTRUCCIONES',
        content: `REGLA CRITICA PARA CALCULAR TOTALES DE VENTAS:

NUNCA uses SUM(lp.total) - esa columna NO es confiable.

USA SIEMPRE esta formula exacta para calcular ingresos/totales:
SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario)

Explicacion:
- cant_total: cantidad final despues de ajustes (prioridad si > 0)
- cantidad: cantidad original del pedido
- precio_unitario: precio de venta del item
- Multiplica cantidad * precio_unitario para obtener el total real

Para mostrar el resultado formateado:
CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs')`,
        isActive: true,
        keywords: 'ventas,vendido,total,totales,ingresos,recaudado,marzo,mes,año,dinero,monto,SUM',
        priority: 10
    },
    {
        key: 'instrucciones_sistema',
        category: 'INSTRUCCIONES',
        content: `INSTRUCCIONES PARA GENERAR SQL - SISTEMA POS RESTAURANTE (pv_mchicken):

TABLAS PRINCIPALES DE VENTAS (las mas importantes):
- pedidos: tabla principal de ventas (pedido_id PK, fecha, estado, cliente_id, nom_pedido_cliente, metodoPago, total)
- lin_pedidos: detalle/lineas de cada pedido (pedido_id FK, item_id FK, cantidad, cant_total, precio_unitario, total, llevar)
- items: productos del menu (item_id PK, descripcion)
- clientes: clientes (cliente_id PK, nit, nombre_razon_social, direccion, telefono, email)

TABLAS SECUNDARIAS:
- facturas: facturas fiscales vinculadas a pedidos (factura_id, pedido_id FK)
- lin_facturas: detalle de facturas (lin_factura_id, factura_id FK, item_id FK, cantidad, precio_unitario, total)
- combos: items de combos en facturas (combo_id, lin_factura_id FK, item_id FK)
- sucursales, cajas, almacenes, empleados, turnos, ajustes

REGLAS CRITICAS:
1. Para ventas/productos usa: pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id
2. SIEMPRE filtra anulados: WHERE p.estado != 'ANULADO'
3. Para cantidades correctas: CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END
4. Para buscar productos: LOWER(i.descripcion) LIKE '%termino%'
5. Para clientes: JOIN clientes c ON p.cliente_id = c.cliente_id
6. Fechas MySQL: CURDATE(), DATE_SUB(CURDATE(), INTERVAL N DAY), DATE(p.fecha)
7. La tabla de productos se llama "items" NO "productos"
8. La tabla de lineas se llama "lin_pedidos" NO "lineas_pedido" ni "lin_facturas"
9. NO uses la tabla combos ni lin_facturas para consultas de ventas - usa pedidos y lin_pedidos`,
        isActive: true,
        keywords: 'ventas,pedidos,items,clientes,productos,sucursales,facturas,lin_pedidos',
        priority: 10
    },
    {
        key: 'ejemplos_ventas_basicas',
        category: 'EJEMPLOS_SQL',
        content: `Pregunta: ¿Cuantas ventas hubo hoy?
SQL: SELECT COUNT(*) as total_pedidos FROM pedidos WHERE DATE(fecha) = CURDATE() AND estado != 'ANULADO';

---

Pregunta: Producto mas vendido
SQL: SELECT i.descripcion, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) as cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' GROUP BY i.descripcion ORDER BY cantidad_vendida DESC LIMIT 1;

---

Pregunta: Total de ventas del mes actual
SQL: SELECT CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs') AS total_ventas FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id WHERE p.estado != 'ANULADO' AND YEAR(p.fecha) = YEAR(CURDATE()) AND MONTH(p.fecha) = MONTH(CURDATE());

---

Pregunta: Top 5 clientes con mas compras
SQL: SELECT c.nombre_razon_social as nombre, COUNT(p.pedido_id) as total_pedidos, CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs') as monto_total FROM clientes c JOIN pedidos p ON c.cliente_id = p.cliente_id JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id WHERE p.estado != 'ANULADO' GROUP BY c.cliente_id, c.nombre_razon_social ORDER BY monto_total DESC LIMIT 5;

---

Pregunta: Ventas de ayer por producto
SQL: SELECT i.descripcion AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad, SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) GROUP BY i.descripcion ORDER BY ingresos DESC;

---

Pregunta: Buscar productos que contengan "pollo"
SQL: SELECT i.descripcion AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND LOWER(i.descripcion) LIKE '%pollo%' GROUP BY i.descripcion ORDER BY cantidad_vendida DESC;

---

Pregunta: Cual es el total de ingresos por ventas en marzo de 2026
SQL: SELECT CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs') AS total_ingresos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id WHERE p.estado != 'ANULADO' AND MONTH(p.fecha) = 3 AND YEAR(p.fecha) = 2026;

---

Pregunta: Cuanto dinero generaron las ventas en total el dia de hoy
SQL: SELECT CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs') AS total_ingresos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = CURDATE();

---

Pregunta: Cuanto fue el total recaudado en ventas el 12 de abril de 2026
SQL: SELECT CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs') AS total_ingresos FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = '2026-04-12';`,
        isActive: true,
        keywords: 'ventas,pedidos,productos,clientes,hoy,ayer,mes,buscar,vendido,marzo,abril,ingresos,recaudado,total',
        priority: 5
    }
];

const seedRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a BD Memoria verificada.');
        
        await sequelize.sync();
        console.log('Tablas sincronizadas.');

        let createdCount = 0;
        let updatedCount = 0;
        for (const rule of rulesSeed) {
            const [record, created] = await ContextRule.findOrCreate({
                where: { key: rule.key },
                defaults: rule
            });
            if (created) {
                createdCount++;
            } else {
                // Update existing rule with new content
                await record.update({
                    content: rule.content,
                    keywords: rule.keywords || record.keywords,
                    priority: rule.priority || record.priority
                });
                updatedCount++;
            }
        }

        console.log(`Seed Completado! Reglas creadas: ${createdCount}, actualizadas: ${updatedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Error insertando las reglas iniciales (seed):', error);
        process.exit(1);
    }
};

seedRules();
