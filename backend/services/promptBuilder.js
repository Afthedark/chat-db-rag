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
    if (rules.ESTRUCTURA_DB) systemPromptParts.push(rules.ESTRUCTURA_DB);
    if (dbDescription) systemPromptParts.push(`\nDescripción extra de la BD consultada: ${dbDescription}`);
    
    if (rules.EJEMPLO_SQL) {
        systemPromptParts.push('\n=== EJEMPLOS DE CONSULTAS ===');
        systemPromptParts.push(rules.EJEMPLO_SQL);
    }
    
    systemPromptParts.push(`\nREGLAS ESTRICTAS:
- Responde ÚNICAMENTE con la consulta SQL. 
- Solo puedes generar comandos SELECT.
- Si no te piden un número de registros específico, asume un máximo lógico y asegúrate de limitarlo si no rompe la agregación (por defecto la app luego agregará LIMIT 150 si falta).
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

    // Limit JSON context to prevent context window overflow (safeguard)
    let jsonString = JSON.stringify(sqlResults);
    if(jsonString.length > 90000) {
        jsonString = JSON.stringify(sqlResults.slice(0, 150)) + '\n... [Resultados truncados por tamaño]';
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
