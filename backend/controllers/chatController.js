const { Chat, Message, DatabaseConnection } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const promptBuilder = require('../services/promptBuilder');
const aiService = require('../services/aiService');
const sqlValidator = require('../services/sqlValidator');
const dbManager = require('../services/dbManager');
// NUEVO: Importar servicio de memoria de consultas
const { findSimilarQueries, saveSuccessfulQuery, markQueryFailed, getSchemaGroup } = require('../services/queryMemoryService');

const handleChat = async (req, res, next) => {
    try {
        const { question, historyId, targetDbId } = req.body;

        if (!question) {
            throw new AppError('La pregunta no puede estar vacía', 400);
        }
        if (!targetDbId) {
            throw new AppError('Debes seleccionar una base de datos', 400);
        }

        const dbConfig = await DatabaseConnection.findByPk(targetDbId);
        if (!dbConfig || !dbConfig.isActive) {
            throw new AppError('Base de datos inválida o inactiva', 400);
        }

        // 1. Initialise Chat if needed
        let currentChatId = historyId;
        if (!currentChatId) {
            let title = question.substring(0, 30);
            if (question.length > 30) title += '...';
            const newChat = await Chat.create({ 
                title, 
                databaseId: targetDbId 
            });
            currentChatId = newChat.id;
        }

        // Save User Message
        await Message.create({
            chatId: parseInt(currentChatId),
            role: 'user',
            content: question
        });

        // ================= PASO 0: Clasificación de Intención =================
        const { systemPrompt: classSystem, userPrompt: classUser } = await promptBuilder.buildClassifierPrompt(question);
        const intent = await aiService.generateResponse([
            { role: 'system', content: classSystem },
            { role: 'user', content: classUser }
        ]);

        console.log(`🎯 Intención detectada: ${intent.trim()}`);

        if (intent.trim().toUpperCase() === 'GENERAL') {
            // RECUPERAR HISTORIAL PARA CONTEXTO (optimizado: solo últimos 3 mensajes)
            const history = await Message.findAll({
                where: { chatId: currentChatId },
                order: [['createdAt', 'DESC']],
                limit: 3
            });
            
            const { systemPrompt: genSystem, userPrompt: genUser } = await promptBuilder.buildGeneralChatPrompt(question, history.reverse());
            const generalReply = await aiService.generateResponse([
                { role: 'system', content: genSystem },
                { role: 'user', content: genUser }
            ]);

            await Message.create({
                chatId: parseInt(currentChatId),
                role: 'assistant',
                content: generalReply
            });

            return res.json({
                success: true,
                reply: generalReply,
                historyId: parseInt(currentChatId)
            });
        }

        // ================= PASO 1: Generación de SQL =================

        // NUEVO: Obtener schemaGroup de la base de datos para compartir ejemplos entre BDs similares
        let schemaGroup = 'default';
        try {
            schemaGroup = await getSchemaGroup(targetDbId);
            console.log(`🏷️ SchemaGroup: ${schemaGroup}`);
        } catch (sgErr) {
            console.warn('⚠️ No se pudo obtener schemaGroup:', sgErr.message);
        }

        // NUEVO: Recuperar ejemplos similares de consultas exitosas previas (por schemaGroup)
        let similarQueries = [];
        try {
            similarQueries = await findSimilarQueries(question, schemaGroup);
            if (similarQueries.length > 0) {
                console.log(`🧠 Few-shots recuperados: ${similarQueries.length} ejemplos similares [${schemaGroup}]`);
            }
        } catch (memErr) {
            console.warn('⚠️ QueryMemory no disponible (tabla aún no creada?):', memErr.message);
        }

        // NUEVO: Intentar enriquecer el esquema con DDL dinámico
        let dynamicSchema = '';
        try {
            dynamicSchema = await dbManager.extractSchemaForPrompt(targetDbId);
            if (dynamicSchema) {
                console.log(`📋 Esquema dinámico extraído: ${dynamicSchema.length} caracteres`);
            }
        } catch (schemaErr) {
            console.warn('⚠️ No se pudo extraer DDL dinámico:', schemaErr.message);
        }

        // MODIFICADO: Pasar similarQueries al builder
        const { systemPrompt: sqlSystemPrompt, userPrompt: sqlUserPrompt } = await promptBuilder.buildSQLPrompt(
            question,
            dynamicSchema || dbConfig.description,
            similarQueries
        );
        
        let rawSQLResponse;
        try {
            rawSQLResponse = await aiService.generateResponse([
                { role: 'system', content: sqlSystemPrompt },
                { role: 'user', content: sqlUserPrompt }
            ]);
        } catch (error) {
            throw new AppError('Hubo un error con la IA generando la consulta.', 500);
        }

        // EXTRAER SOLO EL PRIMER SQL VÁLIDO (ignorar múltiples consultas, texto, etc.)
        console.log('\n📝 === RESPUESTA COMPLETA DE LA IA ===');
        console.log(rawSQLResponse);
        console.log('=====================================\n');
        
        const extractedSQL = sqlValidator.extractFirstSQL(rawSQLResponse);
        console.log('✂️ === SQL EXTRAÍDO ===');
        console.log(extractedSQL);
        console.log('======================\n');

        // ================= VALIDACIÓN =================
        const validation = sqlValidator.validate(extractedSQL);
        if (!validation.isValid) {
            const replyMsg = `⚠️ Lo siento, no puedo ejecutar esta acción: ${validation.error}\n\n**SQL Generado por la IA:**\n\`\`\`sql\n${rawSQLResponse}\n\`\`\``;
            await Message.create({
                chatId: parseInt(currentChatId),
                role: 'assistant',
                content: replyMsg,
                databaseUsed: dbConfig.name
            });
            return res.json({ 
                success: true, 
                reply: replyMsg,
                sqlExecuted: rawSQLResponse, 
                historyId: parseInt(currentChatId),
                chartData: null
            });
        }

        const cleanSQL = validation.cleanSQL;

        // ================= EJECUCIÓN =================
        let queryResults;
        try {
            const executed = await dbManager.executeQuery(targetDbId, cleanSQL);
            queryResults = executed.rows;

            // NUEVO: Aprender de esta consulta exitosa (con schemaGroup)
            try {
                await saveSuccessfulQuery({
                    questionText: question,
                    sqlQuery: cleanSQL,
                    databaseId: targetDbId,
                    schemaGroup: schemaGroup, // NUEVO: Guardar con el grupo de esquema
                    rowsReturned: queryResults ? queryResults.length : 0
                });
                console.log(`💾 Consulta guardada en QueryMemory (${queryResults?.length ?? 0} filas) [${schemaGroup}]`);
            } catch (saveErr) {
                console.warn('⚠️ No se pudo guardar en QueryMemory:', saveErr.message);
            }

        } catch (error) {
             // NUEVO: Penalizar si esta pregunta tenía un SQL en memoria que volvió a fallar (con schemaGroup)
             try {
                await markQueryFailed(question, targetDbId, schemaGroup);
            } catch (_) {}

             const errorMsgStatus = `🔥 Ocurrió un error al ejecutar la estructura en la base de datos.`;
             await Message.create({
                chatId: parseInt(currentChatId),
                role: 'assistant',
                content: errorMsgStatus,
                sqlExecuted: cleanSQL,
                databaseUsed: dbConfig.name
            });
            return res.json({
                success: true,
                reply: `🔥 La base de datos rechazó la consulta. Por favor, asegúrate que las reglas del esquema estén correctas o intenta reformular.`,
                sqlExecuted: cleanSQL,
                historyId: parseInt(currentChatId)
            });
        }

        // ================= PASO 2: Interpretación de datos =================
        const { systemPrompt: busSystemPrompt, userPrompt: busUserPrompt } = await promptBuilder.buildBusinessPrompt(question, queryResults, cleanSQL);
        
        let finalReply;
        try {
            finalReply = await aiService.generateResponse([
                { role: 'system', content: busSystemPrompt },
                { role: 'user', content: busUserPrompt }
            ]);
        } catch (error) {
            finalReply = `Los datos fueron extraidos de manera correcta! pero la IA no pudo contestar con el texto apropiado.`;
        }

        // Save AI Message
        await Message.create({
            chatId: parseInt(currentChatId),
            role: 'assistant',
            content: finalReply,
            sqlExecuted: cleanSQL,
            databaseUsed: dbConfig.name
        });

        res.json({
            success: true,
            reply: finalReply,
            sqlExecuted: cleanSQL,
            historyId: parseInt(currentChatId),
            chartData: queryResults  // Datos para visualización en gráficos
        });

    } catch (error) {
        next(error);
    }
};

const getChats = async (req, res, next) => {
    try {
        const chats = await Chat.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: chats });
    } catch (error) {
        next(error);
    }
};

const getChatHistory = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.findAll({
            where: { chatId },
            order: [['createdAt', 'ASC']]
        });
        res.json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

const deleteChat = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat.findByPk(chatId);
        
        if (!chat) {
            throw new AppError('Chat no encontrado', 404);
        }
        
        await chat.destroy();
        res.json({ success: true, message: 'Chat eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleChat,
    getChats,
    getChatHistory,
    deleteChat
};
