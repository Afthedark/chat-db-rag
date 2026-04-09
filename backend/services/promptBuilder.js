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
    const rules = await fetchActiveRules(['PROMPT_SISTEMA', 'ESTRUCTURA_DB', 'EJEMPLO_SQL']);
    
    const systemPromptParts = [];
    
    if (rules.PROMPT_SISTEMA) {
        systemPromptParts.push(rules.PROMPT_SISTEMA);
    } else {
        systemPromptParts.push("Eres un asistente experto en MySQL. Tu trabajo es interpretar la pregunta y generar UNA SOLA consulta SQL de tipo SELECT para extraer la información. No agregues explicaciones adicionales.");
    }
    
    systemPromptParts.push('\n=== ESTRUCTURA DE LA BASE DE DATOS ===');
    
    // OPTIMIZACIÓN: Limitar tamaño del esquema para modelos locales
    const MAX_SCHEMA_LENGTH = 8000; // ~2K tokens aprox
    if (rules.ESTRUCTURA_DB) {
        if (rules.ESTRUCTURA_DB.length > MAX_SCHEMA_LENGTH) {
            systemPromptParts.push(rules.ESTRUCTURA_DB.substring(0, MAX_SCHEMA_LENGTH));
            systemPromptParts.push('\n[Esquema truncado por tamaño...]');
        } else {
            systemPromptParts.push(rules.ESTRUCTURA_DB);
        }
    }
    
    if (dbDescription) systemPromptParts.push(`\nDescripción extra de la BD consultada: ${dbDescription}`);
    
    if (rules.EJEMPLO_SQL) {
        systemPromptParts.push('\n=== EJEMPLOS DE CONSULTAS ===');
        systemPromptParts.push(rules.EJEMPLO_SQL);
    }
    
    systemPromptParts.push(`\nREGLAS ESTRICTAS:
- Responde ÚNICAMENTE con la consulta SQL. 
- Solo puedes generar comandos SELECT.
- Si no te piden un número de registros específico, asume un máximo lógico y asegúrate de limitarlo si no rompe la agregación (por defecto la app luego agregará LIMIT 1000 si falta).
- NUNCA uses INSERT, UPDATE, DELETE, DROP.
- No uses delimitadores de markdown tipo \`\`\`sql en la respuesta, devuelve solo la cadena SQL.`);

    return {
        systemPrompt: systemPromptParts.join('\n'),
        userPrompt: `Pregunta de usuario: ${question}`
    };
};

const buildBusinessPrompt = async (question, sqlResults, sqlQuery) => {
    const rules = await fetchActiveRules(['PROMPT_NEGOCIO']);
    
    let systemPrompt = `Eres un analista de datos empresarial y experto en interpretar bases de datos. 
Tu trabajo es escribir una respuesta en lenguaje natural para el usuario, basándote en los resultados directos que se obtuvieron de ejecutar su consulta en SQL.`;

    if (rules.PROMPT_NEGOCIO) {
        systemPrompt += `\n\n${rules.PROMPT_NEGOCIO}`;
    }

    // OPTIMIZACIÓN: Limitar contexto para modelos locales (128K max)
    // Estrategia: Muestreo inteligente para grandes resultados
    let processedResults = sqlResults;
    
    if (sqlResults.length > 50) {
        // Para grandes volúmenes: primeros 25, últimos 25, y muestra del medio
        const first = sqlResults.slice(0, 25);
        const last = sqlResults.slice(-25);
        const middleSample = sqlResults.length > 100 
            ? sqlResults.slice(Math.floor(sqlResults.length/2) - 5, Math.floor(sqlResults.length/2) + 5)
            : [];
        
        processedResults = [
            ...first,
            { _note: `... ${sqlResults.length - 50} registros omitidos ...` },
            ...middleSample,
            { _note: '... registros finales ...' },
            ...last
        ];
    }
    
    let jsonString = JSON.stringify(processedResults);
    
    // Límite conservador para modelos locales: ~15K caracteres (~4K tokens)
    const MAX_CONTEXT_LENGTH = 15000;
    if (jsonString.length > MAX_CONTEXT_LENGTH) {
        // Truncar manteniendo estructura válida
        const truncated = processedResults.slice(0, Math.max(10, Math.floor(processedResults.length / 2)));
        jsonString = JSON.stringify(truncated) + `\n... [Resultado truncado: ${sqlResults.length} registros totales]`;
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
