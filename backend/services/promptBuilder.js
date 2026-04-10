const { ContextRule } = require('../models');

const fetchActiveRules = async (categories) => {
    const rules = await ContextRule.findAll({
        where: {
            isActive: true,
            category: categories
        }
    });
    
    // Group them by Category
    const grouped = categories.reduce((acc, cat) => {
        acc[cat] = rules.filter(r => r.category === cat).map(r => r.content).join('\n---\n');
        return acc;
    }, {});
    
    return grouped;
};

const buildSQLPrompt = async (question, dbDescription) => {
    const rules = await fetchActiveRules(['INSTRUCCIONES', 'EJEMPLOS_SQL']);
    
    const systemPromptParts = [];
    
    // Instrucciones base
    systemPromptParts.push(`Eres un experto en MySQL y analista de datos. Tu tarea principal es convertir requerimientos y preguntas hechas en lenguaje natural a consultas SQL válidas.

REGLAS DE SEGURIDAD:
- Solo puedes generar sentencias de tipo SELECT o SHOW
- NUNCA uses INSERT, UPDATE, DELETE, DROP o cualquier comando que modifique datos
- No uses funciones de archivo como LOAD_FILE

FORMATO DE RESPUESTA:
- Responde ÚNICAMENTE con la consulta SQL requerida
- Sin explicaciones adicionales
- NO uses bloques de markdown
- Devuelve solo la cadena SQL pura lista para ejecutarse`);
    
    // Agregar reglas personalizadas si existen
    if (rules.INSTRUCCIONES) {
        systemPromptParts.push('\n=== INSTRUCCIONES ADICIONALES ===');
        systemPromptParts.push(rules.INSTRUCCIONES);
    }
    
    // ESTRUCTURA DE BASE DE DATOS - CRÍTICO
    systemPromptParts.push('\n=== ESTRUCTURA DE LA BASE DE DATOS - USAR EXACTAMENTE ESTOS NOMBRES ===');
    if (dbDescription) {
        systemPromptParts.push(dbDescription);
    } else {
        systemPromptParts.push('No se proporcionó descripción de la base de datos.');
    }
    
    // Ejemplos SQL
    if (rules.EJEMPLOS_SQL) {
        systemPromptParts.push('\n=== EJEMPLOS DE CONSULTAS (APRENDE DE ESTOS PATRONES) ===');
        systemPromptParts.push(rules.EJEMPLOS_SQL);
        systemPromptParts.push('\n=== FIN EJEMPLOS ===');
    }
    
    systemPromptParts.push(`\n=== REGLAS ESTRICTAS Y OBLIGATORIAS ===
1. USA EXACTAMENTE los nombres de tablas y columnas definidos en la ESTRUCTURA DE BASE DE DATOS arriba
2. Para buscar productos: usa LOWER(i.descripcion) LIKE '%termino%'
3. Para cantidades: usa CASE WHEN lp.cant_total > 0 THEN lp.cant_total ELSE lp.cantidad END
4. SIEMPRE excluye pedidos ANULADOS: WHERE p.estado != 'ANULADO'
5. JOINs correctos: pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id
6. Responde ÚNICAMENTE con la consulta SQL pura, sin markdown, sin explicaciones
7. Solo comandos SELECT permitidos`);

    const finalPrompt = {
        systemPrompt: systemPromptParts.join('\n'),
        userPrompt: `Pregunta de usuario: ${question}\n\nGenera el SQL usando EXACTAMENTE los nombres de tablas y columnas de la estructura proporcionada arriba.`
    };
    
    // Debug: log del prompt completo
    console.log('=== SQL PROMPT DEBUG ===');
    console.log('System Prompt Length:', finalPrompt.systemPrompt.length);
    console.log('DB Description Included:', dbDescription ? 'YES' : 'NO');
    console.log('DB Description Length:', dbDescription ? dbDescription.length : 0);
    console.log('User Prompt:', finalPrompt.userPrompt);
    console.log('========================');
    
    return finalPrompt;
};

const buildBusinessPrompt = async (question, sqlResults, sqlQuery) => {
    let systemPrompt = `Eres un analista de datos empresarial y experto en interpretar bases de datos. 
Tu trabajo es escribir una respuesta en lenguaje natural para el usuario, basándote en los resultados directos que se obtuvieron de ejecutar su consulta en SQL.

INSTRUCCIONES:
- Interpreta los datos de forma clara, amigable y muy concisa
- Utiliza formato de listas o tablas markdown siempre que ayude a estructurar la información cuando haya más de 2 registros devueltos
- Si hay tendencias o anomalías en la data provista, resáltalas`;

    // Limit JSON context to prevent context window overflow (safeguard)
    let jsonString = JSON.stringify(sqlResults);
    if(jsonString.length > 400000) {
        jsonString = JSON.stringify(sqlResults.slice(0, 1000)) + '\n... [Resultados truncados por tamaño]';
    }

    const userPrompt = `Pregunta original del usuario: "${question}"

SQL que se ejecutó para responder esto:
${sqlQuery}

Resultados (JSON proporcionado por la BD):
${jsonString}

Basado EXCLUSIVAMENTE en esos resultados, redacta una respuesta clara, concisa y fácil de leer para el usuario. Si aplica, usa viñetas, o formatea en tablas (markdown) los datos para que sean fáciles de digerir. NO digas cosas como "según el json provisto..." simplemente da la respuesta como tuya. Si el resultado está vacío di que no se encontraron datos.`;

    return {
        systemPrompt,
        userPrompt
    };
};

const buildClassifierPrompt = async (question) => {
    return {
        systemPrompt: `Eres un clasificador de intenciones experto. Tu única tarea es analizar la entrada del usuario y determinar si requiere una consulta a una BASE DE DATOS SQL o si es una CONVERSACIÓN GENERAL (saludos, preguntas sobre ti, charla casual, ayuda general).
        
REGLAS:
- Responde ÚNICAMENTE con la palabra "DATABASE" si la pregunta pide datos, tablas, conteos, reportes o información que residiría en una base de datos.
- Responde ÚNICAMENTE con la palabra "GENERAL" si es un saludo, despedida, agradecimiento, o una pregunta que no requiere extraer datos específicos de una tabla SQL.
- Si tienes duda, prioriza "DATABASE".`,
        userPrompt: `Pregunta: "${question}"`
    };
};

const buildGeneralChatPrompt = async (question, chatHistory = []) => {
    const historyContext = chatHistory.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');
    
    return {
        systemPrompt: `Eres un asistente de IA empresarial inteligente y amigable. Tu objetivo es ayudar al usuario con dudas generales, explicar tus capacidades (que incluyen consultar bases de datos mediante RAG), o simplemente mantener una conversación fluida. 
        
No tienes acceso directo a los datos en este modo, si te piden datos específicos, recuérdales que puedes consultarlos si hacen una pregunta específica sobre ellos.`,
        userPrompt: `Historial reciente:\n${historyContext}\n\nPregunta actual: ${question}`
    };
};

module.exports = {
    buildSQLPrompt,
    buildBusinessPrompt,
    buildClassifierPrompt,
    buildGeneralChatPrompt
};
