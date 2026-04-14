const { sequelize, ContextRule } = require('../models');

// NOTA: Si ya existen reglas con estas keys en la BD, la funcion seedRules
// las actualizara automaticamente con el nuevo contenido (upsert).
const rulesSeed = [
    {
        key: 'calculo_totales_ventas',
        category: 'INSTRUCCIONES',
        content: `REGLA CRITICA PARA CALCULAR TOTALES DE VENTAS:

Para obtener el total de ventas/ingresos, usa directamente la columna 'total' de la tabla 'pedidos'.
Esta columna ya incluye el monto completo de cada pedido (con y sin factura).

Formula correcta:
CONCAT(ROUND(SUM(total), 2), ' Bs')

IMPORTANTE:
- La tabla 'pedidos' tiene la columna 'total' que ya contiene el monto final de cada venta
- NO es necesario hacer JOIN con lin_pedidos para calcular totales agregados
- Al buscar directamente en pedidos, se incluyen automaticamente todas las ventas (con y sin factura)
- Esto garantiza que el ingreso total sea el 100% real

Ejemplo:
SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND MONTH(fecha) = 3 AND YEAR(fecha) = 2026;`,
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
        key: 'interpretacion_respuestas_temporales',
        category: 'INSTRUCCIONES',
        content: `REGLA CRITICA PARA INTERPRETAR RESULTADOS TEMPORALES:

Cuando interpretes los resultados de una consulta SQL, debes hacer referencia al PERIODO DE TIEMPO correcto que se consulto, no al dia actual.

REGLAS DE INTERPRETACION:

1. Si el SQL usa CURDATE() o DATE(fecha) = CURDATE():
   - El resultado corresponde a HOY (el dia actual)
   - Di: "Hoy tuvimos X ventas..."

2. Si el SQL usa DATE_SUB(CURDATE(), INTERVAL 1 DAY):
   - El resultado corresponde a AYER (el dia anterior)
   - Di: "Ayer tuvimos X ventas..." o "El dia anterior tuvimos..."

3. Si el SQL usa YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1):
   - El resultado corresponde a ESTA SEMANA
   - Di: "Esta semana tuvimos..."

4. Si el SQL usa MONTH(fecha) = MONTH(CURDATE()):
   - El resultado corresponde a ESTE MES
   - Di: "Este mes tuvimos..."

5. Si el SQL usa YEAR(fecha) = 2025 o YEAR(fecha) = 2026:
   - El resultado corresponde a ESE AÑO ESPECIFICO
   - Di: "En el año 2025 tuvimos..." o "En marzo de 2026 tuvimos..."

EJEMPLO DE ERROR COMUN (NO HACER):
- Usuario pregunta: "Dame las ventas de ayer"
- SQL generado: SELECT ... WHERE DATE(fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
- Respuesta INCORRECTA: "Hoy tuvimos 78 ventas..."
- Respuesta CORRECTA: "Ayer tuvimos 78 ventas..."

SIEMPRE verifica el filtro de fecha en el SQL antes de redactar tu respuesta.`,
        isActive: true,
        keywords: 'hoy,ayer,interpretacion,respuesta,fecha,temporal,resultados,CURDATE,DATE_SUB',
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
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE());

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
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND MONTH(fecha) = 3 AND YEAR(fecha) = 2026;

---

Pregunta: Cuanto dinero generaron las ventas en total el dia de hoy
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND DATE(fecha) = CURDATE();

---

Pregunta: Cuanto fue el total recaudado en ventas el 12 de abril de 2026
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND DATE(fecha) = '2026-04-12';`,
        isActive: true,
        keywords: 'ventas,pedidos,productos,clientes,hoy,ayer,mes,buscar,vendido,marzo,abril,ingresos,recaudado,total',
        priority: 5
    },
    {
        key: 'ej_ventas_totales_agregados',
        category: 'EJEMPLOS_SQL',
        content: `Pregunta: ¿Cuántas ventas (pedidos) hubo hoy y cuál es el total de dinero recaudado?
SQL: SELECT COUNT(pedido_id) AS cantidad_de_ventas, CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND DATE(fecha) = CURDATE();

---

Pregunta: ¿Cuál fue el ingreso total por ventas durante el mes de marzo de 2026?
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND MONTH(fecha) = 3 AND YEAR(fecha) = 2026;

---

Pregunta: Dame el total general de ingresos generados exactamente el 12 - abril - 2026 (sumando todo con y sin factura).
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND DATE(fecha) = '2026-04-12';

---

Pregunta: ¿Cuánto dinero llevamos recaudado en ventas en todo lo que va de este año?
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND YEAR(fecha) = YEAR(CURDATE());

---

Pregunta: ¿Cuál es la recaudación global de todas las ventas realizadas en el mes actual?
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE());

---

Pregunta: ¿Cuánto vendimos en total durante todo el año 2025?
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND YEAR(fecha) = 2025;

---

Pregunta: Dime las ventas de marzo de 2026
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND MONTH(fecha) = 3 AND YEAR(fecha) = 2026;

---

Pregunta: Total vendido en marzo de 2026
SQL: SELECT CONCAT(ROUND(SUM(total), 2), ' Bs') AS ingresos_totales FROM pedidos WHERE estado != 'ANULADO' AND MONTH(fecha) = 3 AND YEAR(fecha) = 2026;`,
        isActive: true,
        keywords: 'ventas,vendido,total,marzo,mes,ingresos,recaudado,dinero,bs,bolivianos',
        priority: 10
    },
    {
        key: 'ej_intervalos_tiempo',
        category: 'EJEMPLOS_SQL',
        content: `Pregunta: ¿Qué productos fueron los más vendidos hoy entre las 10:00 am y las 2:00 pm?
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = CURDATE() AND HOUR(p.fecha) >= 10 AND HOUR(p.fecha) < 14 GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC;

---

Pregunta: ¿Cuántos productos se vendieron ayer entre las 9:00 am y las 10:00 am?
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND HOUR(p.fecha) = 9 GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC;

---

Pregunta: ¿Cuánto dinero generó cada producto vendido el 15 de abril de 2026 entre las 3:00 pm y las 5:00 pm?
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_generados FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = '2026-04-15' AND HOUR(p.fecha) >= 15 AND HOUR(p.fecha) < 17 GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY ingresos_generados DESC;

---

Pregunta: ¿Cuántas "Sanguchitas" (en todas sus presentaciones) se vendieron hoy específicamente al mediodía (entre las 12:00 pm y las 2:00 pm)?
SQL: SELECT SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_sanguchitas FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = CURDATE() AND HOUR(p.fecha) >= 12 AND HOUR(p.fecha) < 14 AND LOWER(i.descripcion) LIKE '%sanguchita%';

---

Pregunta: Top 3 de productos más vendidos durante el horario de cena (6:00 pm a 9:00 pm) del 10 de mayo de 2026.
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = '2026-05-10' AND HOUR(p.fecha) >= 18 AND HOUR(p.fecha) < 21 GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC LIMIT 3;

---

Pregunta: Muestra el reporte de ventas e ingresos por producto del turno mañana de ayer (entre las 8:00 am y las 12:00 pm).
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida, SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) AS ingresos_totales FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND HOUR(p.fecha) >= 8 AND HOUR(p.fecha) < 12 GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY ingresos_totales DESC;`,
        isActive: true,
        keywords: 'horario,tiempo,intervalo,hora,am,pm,mediodia,cena,turno,mañana,tarde,productos,vendidos',
        priority: 5
    },
    {
        key: 'ej_productos_mas_vendidos',
        category: 'EJEMPLOS_SQL',
        content: `Pregunta: ¿Cuáles son los productos más vendidos de esta semana?
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND YEARWEEK(p.fecha, 1) = YEARWEEK(CURDATE(), 1) GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC;

---

Pregunta: Los 5 productos más vendidos hoy
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND DATE(p.fecha) = CURDATE() GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC LIMIT 5;

---

Pregunta: Productos más vendidos de la última semana (solo cantidad, sin ingresos)
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC;

---

Pregunta: Productos más vendidos de la última semana con sus ingresos en Bolivianos
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida, CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs') AS ingresos_totales FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC;

---

Pregunta: ¿Cuáles fueron los productos más vendidos ayer durante el horario de almuerzo (entre las 11:00 am y las 2:00 pm)?
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, SUM(CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) AS cantidad_vendida FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND p.fecha >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 11:00:00') AND p.fecha < CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 14:00:00') GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY cantidad_vendida DESC LIMIT 1000;

---

Pregunta: ¿Cuánto dinero en Bolivianos generó cada producto ayer en las últimas horas de atención (después de las 10:00 pm)?
SQL: SELECT TRIM(REPLACE(i.descripcion, '(PLL)', '')) AS producto, CONCAT(ROUND(SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario), 2), ' Bs') AS ingresos_totales FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE p.estado != 'ANULADO' AND p.fecha >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 22:00:00') AND p.fecha < CURDATE() GROUP BY TRIM(REPLACE(i.descripcion, '(PLL)', '')) ORDER BY SUM((CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END) * lp.precio_unitario) DESC;`,
        isActive: true,
        keywords: 'productos,vendidos,mas,top,ranking,estrella,semana,mes,año,hoy,ayer,ingresos,almuerzo,horario',
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
