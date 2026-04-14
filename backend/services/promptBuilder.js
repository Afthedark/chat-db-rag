const { ContextRule } = require('../models');
const memoryManager = require('./memoryManager');
const { Op } = require('sequelize');

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

/**
 * NEW: Fetch smart context rules based on question keywords
 */
const fetchSmartContextRules = async (question, categories) => {
    return await memoryManager.getSmartContextRules(question, categories);
};

const buildSQLPrompt = async (question, dbDescription, dynamicSchema = null) => {
    // Use smart context rules if available, fallback to basic fetch
    let rules;
    try {
        const smartRules = await fetchSmartContextRules(question, ['INSTRUCCIONES', 'EJEMPLOS_SQL']);
        rules = ['INSTRUCCIONES', 'EJEMPLOS_SQL'].reduce((acc, cat) => {
            acc[cat] = smartRules.filter(r => r.category === cat).map(r => r.content).join('\n---\n');
            return acc;
        }, {});
    } catch (error) {
        console.warn('Smart context failed, falling back to basic rules:', error.message);
        rules = await fetchActiveRules(['INSTRUCCIONES', 'EJEMPLOS_SQL']);
    }

    // Dynamic budgets based on model capabilities
    const useGeminiOptimizations = process.env.USE_GEMINI_OPTIMIZATIONS === 'true';
    const TOTAL_BUDGET = useGeminiOptimizations ? 50000 : 7000; // 50K for Gemini 1M, 7K for 128K
    const SCHEMA_MAX = useGeminiOptimizations ? 10000 : 2000;   // 10K for Gemini, 2K for standard
    
    // === BUILD PROMPT IN PRIORITY ORDER (most important FIRST for 8B models) ===
    
    // [1] ROL + FORMATO (always included, ~200 chars)
    const roleSection = `Eres experto MySQL. Convierte preguntas en lenguaje natural a SQL.
RESPONDE SOLO con la consulta SQL pura. Sin explicaciones, sin markdown, sin bloques de codigo.
Solo SELECT o SHOW permitidos. NUNCA INSERT, UPDATE, DELETE, DROP.`;

    // [2] INSTRUCCIONES - Critical rules with correct table names and JOINs
    let instrSection = '';
    if (rules.INSTRUCCIONES) {
        const instrLimit = useGeminiOptimizations ? 8000 : 1500;
        instrSection = '\n=== INSTRUCCIONES DEL SISTEMA (SEGUIR OBLIGATORIAMENTE) ===\n' + 
            rules.INSTRUCCIONES.substring(0, instrLimit);
    }
    
    // [3] REGLAS HARDCODED - Compact critical rules
    const rulesSection = `\n=== REGLAS OBLIGATORIAS ===
1. USA EXACTAMENTE los nombres de tablas y columnas de las INSTRUCCIONES arriba - NO INVENTES NOMBRES
2. Sintaxis MySQL: CURDATE() para fecha actual, DATE_SUB() para intervalos - NO uses DATE('now')
3. Para buscar texto: LOWER(columna) LIKE '%termino%'
4. SIEMPRE excluye pedidos anulados: WHERE p.estado != 'ANULADO'
5. Para filtrar por HORA usa: HOUR(p.fecha) >= X AND HOUR(p.fecha) < Y. NUNCA uses TIME() BETWEEN
6. Responde UNICAMENTE con SQL puro listo para ejecutar`;

    // [4] EJEMPLOS SQL - THE MOST VALUABLE PART for 8B models (learn by imitation)
    let examplesSection = '';
    if (rules.EJEMPLOS_SQL) {
        const examplesLimit = useGeminiOptimizations ? 15000 : 2000;
        examplesSection = '\n=== EJEMPLOS SQL (COPIA ESTOS PATRONES EXACTAMENTE) ===\n' + 
            rules.EJEMPLOS_SQL.substring(0, examplesLimit);
    }
    
    // [5] SCHEMA - Supplementary reference (LOWEST priority, trimmed first)
    let schemaSection = '';
    const schemaSource = dynamicSchema || dbDescription;
    if (schemaSource) {
        const cappedSchema = schemaSource.substring(0, SCHEMA_MAX);
        schemaSection = '\n=== SCHEMA DE REFERENCIA (complementario) ===\n' + cappedSchema;
    }

    // === ASSEMBLE with budget control ===
    // Priority: role > instrucciones > rules > examples > schema
    // If budget exceeded, trim schema first, then cap examples
    
    let systemPrompt = roleSection + instrSection + rulesSection + examplesSection + schemaSection;
    
    if (systemPrompt.length > TOTAL_BUDGET) {
        console.warn(`⚠️ Prompt exceeds budget: ${systemPrompt.length}/${TOTAL_BUDGET} chars.`);
        
        // Step 1: Remove schema entirely
        systemPrompt = roleSection + instrSection + rulesSection + examplesSection;
        console.warn(`   After removing schema: ${systemPrompt.length} chars`);
        
        if (systemPrompt.length > TOTAL_BUDGET) {
            // Step 2: Trim examples to fit
            const availableForExamples = TOTAL_BUDGET - (roleSection + instrSection + rulesSection).length;
            if (availableForExamples > 200 && rules.EJEMPLOS_SQL) {
                examplesSection = '\n=== EJEMPLOS SQL ===\n' + rules.EJEMPLOS_SQL.substring(0, availableForExamples - 50);
            } else {
                examplesSection = '';
            }
            systemPrompt = roleSection + instrSection + rulesSection + examplesSection;
            console.warn(`   After trimming examples: ${systemPrompt.length} chars`);
        }
    }

    const finalPrompt = {
        systemPrompt,
        userPrompt: `Pregunta: ${question}\n\nGenera SOLO el SQL usando las tablas y columnas de las instrucciones y ejemplos.`
    };
    
    // Debug logging
    console.log('=== SQL PROMPT DEBUG ===');
    console.log('Total Prompt Length:', finalPrompt.systemPrompt.length, '/', TOTAL_BUDGET);
    console.log('Sections included:');
    console.log('  Role:', roleSection.length, 'chars');
    console.log('  Instrucciones:', instrSection.length, 'chars', instrSection ? 'YES' : 'NONE');
    console.log('  Rules:', rulesSection.length, 'chars');
    console.log('  Examples:', examplesSection.length, 'chars', examplesSection ? 'YES' : 'NONE');
    console.log('  Schema:', schemaSection.length, 'chars', schemaSection ? 'YES' : 'TRIMMED/NONE');
    console.log('Schema Source:', dynamicSchema ? 'DYNAMIC' : (dbDescription ? 'DESCRIPTION' : 'NONE'));
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
- Si hay tendencias o anomalías en la data provista, resáltalas
- IMPORTANTE: Cuando muestres montos de dinero, usa el formato "Bs" (Bolivianos) o el símbolo "$" según el contexto. Si el resultado SQL incluye "Bs" en el valor, presérvalo. Nunca inventes monedas que no aparecen en los datos.`;

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

const buildGeneralChatPrompt = async (question, chatHistory = [], summary = null) => {
    const historyContext = chatHistory.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');
    
    let summaryContext = '';
    if (summary) {
        summaryContext = `
=== RESUMEN DE CONVERSACIÓN ANTERIOR ===
Esta conversación ha sido resumida para mantener el contexto:
- Bases de datos consultadas: ${summary.summary.databasesQueried.join(', ') || 'Ninguna'}
- Consultas SQL ejecutadas: ${summary.summary.sqlQueriesExecuted}
- Temas discutidos: ${summary.summary.topicsDiscussed.join(', ') || 'Varios'}

Este resumen proporciona el contexto de las interacciones anteriores.
=== FIN DEL RESUMEN ===

`;
    }

    return {
        systemPrompt: `Eres un asistente de IA empresarial inteligente y amigable. Tu objetivo es ayudar al usuario con dudas generales, explicar tus capacidades (que incluyen consultar bases de datos mediante RAG), o simplemente mantener una conversación fluida.

No tienes acceso directo a los datos en este modo, si te piden datos específicos, recuérdales que puedes consultarlos si hacen una pregunta específica sobre ellos.

${summaryContext ? 'IMPORTANTE: Tienes contexto resumido de conversaciones anteriores. Úsalo para mantener coherencia.' : ''}`,
        userPrompt: `${summaryContext}Historial reciente:
${historyContext}

Pregunta actual: ${question}`
    };
};

module.exports = {
    buildSQLPrompt,
    buildBusinessPrompt,
    buildClassifierPrompt,
    buildGeneralChatPrompt,
    fetchSmartContextRules
};
