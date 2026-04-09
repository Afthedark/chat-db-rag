const { sequelize, ContextRule } = require('../models');

const rulesSeed = [
    {
        key: 'instrucciones_sistema',
        category: 'INSTRUCCIONES',
        content: `Eres un experto en MySQL y analista de datos. Tu tarea principal es convertir requerimientos y preguntas hechas en lenguaje natural a consultas SQL válidas.

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
        key: 'ejemplos_ventas',
        category: 'EJEMPLOS_SQL',
        content: `Pregunta: ¿Cuántas ventas hubo en total hoy?
SQL: SELECT COUNT(*) as total_ventas FROM ventas WHERE DATE(fecha_operacion) = CURDATE();

---

Pregunta: Muéstrame el producto que más vendió y cuanto de ingresos generó
SQL: SELECT p.nombre, SUM(dv.cantidad * dv.precio_unitario) as total_ingresos FROM productos p JOIN detalle_ventas dv ON p.id = dv.producto_id GROUP BY p.id, p.nombre ORDER BY total_ingresos DESC LIMIT 1;

---

Pregunta: Total de ventas del mes actual
SQL: SELECT SUM(total) as ventas_mes FROM ventas WHERE YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE());

---

Pregunta: Top 5 clientes con más compras
SQL: SELECT c.nombre, COUNT(v.id) as total_compras, SUM(v.total) as monto_total FROM clientes c JOIN ventas v ON c.id = v.cliente_id GROUP BY c.id ORDER BY monto_total DESC LIMIT 5;

---

Pregunta: Productos sin ventas en los últimos 30 días
SQL: SELECT p.nombre FROM productos p LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id LEFT JOIN ventas v ON dv.venta_id = v.id AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) WHERE v.id IS NULL;`,
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
