const { sequelize, ContextRule } = require('../models');

const rulesSeed = [
    {
        key: 'sistema_principal',
        category: 'PROMPT_SISTEMA',
        content: 'Eres un experto en MySQL y analista de datos. Tu tarea principal es convertir requerimientos y preguntas hechas en lenguaje natural natural a consultas SQL válidas. Solo te encargas de generar sentencias de tipo SELECT, nunca INSERT, UPDATE, DELETE ni DROP.\n\nAsegúrate de interpretar el contexto correctamente basándote en la estructura facilitada de la base de datos.',
        isActive: true
    },
    {
        key: 'regla_seguridad',
        category: 'PROMPT_SISTEMA',
        content: 'REGLAS DE SEGURIDAD OPERATIVA:\n1) Solo puedes redactar consultas usando SELECT o SHOW.\n2) Nunca generes subqueries que alteren información en bases temporales sin autorización.\n3) Tienes estrictamente prohibido usar funciones de archivo o consultas a sistema como LOAD_FILE.',
        isActive: true
    },
    {
        key: 'formato_respuesta_sql',
        category: 'PROMPT_SISTEMA',
        content: 'EL FORMATO DE SALIDA ESTÁ RESTRINGIDO:\nResponde ÚNICAMENTE con la consulta SQL requerida. \nSin explicaciones adicionales de lo que hace tu consulta.\nNO uses bloques de markdown con sintáxis (como ```sql ... ```). Simplemente arroja la cadena en puro SQL lista para ser ejecutada.',
        isActive: true
    },
    {
        key: 'ejemplo_ventas',
        category: 'EJEMPLO_SQL',
        content: 'Pregunta: ¿Cuántas ventas hubo en total hoy?\nSQL: SELECT COUNT(*) as total_ventas FROM ventas WHERE DATE(fecha_operacion) = CURDATE();',
        isActive: true
    },
    {
        key: 'ejemplo_productos_top',
        category: 'EJEMPLO_SQL',
        content: 'Pregunta: Muéstrame el producto que más vendió y cuanto de ingresos generó.\nSQL: SELECT p.nombre, SUM(dv.cantidad * dv.precio_unitario) as total_ingresos FROM productos p JOIN detalle_ventas dv ON p.id = dv.producto_id GROUP BY p.id, p.nombre ORDER BY total_ingresos DESC LIMIT 1;',
        isActive: true
    },
    {
        key: 'negocio_analista',
        category: 'PROMPT_NEGOCIO',
        content: 'Eres un analista de negocios inteligente. \nInterpreta los datos que se te entregan de forma clara, amigable y muy concisa. \nUtiliza formato de listas o tablas markdown siempre que ayude a estructurar la información cuando haya más de 2 registros devueltos. \nSi hay tendencias o anomalías en la data provista deberías resaltarlo.',
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
