const { Chat, Message, DatabaseConnection, SQLCache } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const promptBuilder = require('../services/promptBuilder');
const aiService = require('../services/aiService');
const sqlValidator = require('../services/sqlValidator');
const dbManager = require('../services/dbManager');
const memoryManager = require('../services/memoryManager');
const embeddingService = require('../services/embeddingService');

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

        // Save User Message with embedding
        const questionEmbedding = embeddingService.generateSimpleEmbedding(question);
        await Message.create({
            chatId: parseInt(currentChatId),
            role: 'user',
            content: question,
            embedding: JSON.stringify(questionEmbedding)
        });

        // ================= PASO 0: Clasificación de Intención =================
        const { systemPrompt: classSystem, userPrompt: classUser } = await promptBuilder.buildClassifierPrompt(question);
        const intent = await aiService.generateResponse([
            { role: 'system', content: classSystem },
            { role: 'user', content: classUser }
        ]);

        console.log(`🎯 Intención detectada: ${intent.trim()}`);

        if (intent.trim().toUpperCase() === 'GENERAL') {
            // IMPROVEMENT A: Dynamic history limit
            const messageCount = await Message.count({ where: { chatId: currentChatId } });
            const historyLimit = memoryManager.getDynamicHistoryLimit(messageCount, intent);
            
            const history = await Message.findAll({
                where: { chatId: currentChatId },
                order: [['createdAt', 'DESC']],
                limit: historyLimit
            });

            // IMPROVEMENT D: Summarization for long conversations
            const summary = await memoryManager.summarizeConversation(
                history.reverse(),
                15
            );

            const { systemPrompt: genSystem, userPrompt: genUser } = await promptBuilder.buildGeneralChatPrompt(
                question, 
                summary ? summary.recentMessages : history.reverse(),
                summary
            );
            
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

        // ================= IMPROVEMENT C: Check SQL Cache =================
        const cachedSQL = await memoryManager.checkSQLCache(question, targetDbId);
        
        if (cachedSQL) {
            console.log(`⚡ Using cached SQL for: ${question.substring(0, 50)}...`);
            
            // Execute cached query
            let queryResults;
            try {
                const executed = await dbManager.executeQuery(targetDbId, cachedSQL.sqlQuery);
                queryResults = executed.rows;
            } catch (error) {
                console.log('⚠️ Cached SQL failed, regenerating:', error.message);
                // Fall through to normal generation
            }
            
            if (queryResults) {
                // Build business response from cached results
                const { systemPrompt: busSystemPrompt, userPrompt: busUserPrompt } = 
                    await promptBuilder.buildBusinessPrompt(question, queryResults, cachedSQL.sqlQuery);

                let finalReply;
                try {
                    finalReply = await aiService.generateResponse([
                        { role: 'system', content: busSystemPrompt },
                        { role: 'user', content: busUserPrompt }
                    ]);
                } catch (error) {
                    finalReply = `Datos recuperados del caché exitosamente.`;
                }

                await Message.create({
                    chatId: parseInt(currentChatId),
                    role: 'assistant',
                    content: finalReply,
                    sqlExecuted: cachedSQL.sqlQuery,
                    databaseUsed: dbConfig.name
                });

                // Infer preferences
                await memoryManager.inferPreferences(currentChatId, question, cachedSQL.sqlQuery);

                return res.json({
                    success: true,
                    reply: finalReply,
                    sqlExecuted: cachedSQL.sqlQuery,
                    historyId: parseInt(currentChatId),
                    fromCache: true
                });
            }
        }

        // ================= PASO 1: Generación de SQL =================
        console.log('=== DB CONFIG DEBUG ===');
        console.log('Connection ID:', dbConfig.id);
        console.log('Connection Name:', dbConfig.name);
        console.log('Description exists:', !!dbConfig.description);
        console.log('Description length:', dbConfig.description ? dbConfig.description.length : 0);
        console.log('Description preview:', dbConfig.description ? dbConfig.description.substring(0, 200) + '...' : 'EMPTY');
        console.log('=======================');

        const { systemPrompt: sqlSystemPrompt, userPrompt: sqlUserPrompt } = await promptBuilder.buildSQLPrompt(question, dbConfig.description);

        let rawSQLResponse;
        try {
            rawSQLResponse = await aiService.generateResponse([
                { role: 'system', content: sqlSystemPrompt },
                { role: 'user', content: sqlUserPrompt }
            ]);

            // Debug: log de la respuesta de la IA
            console.log('=== IA RESPONSE DEBUG ===');
            console.log('Raw SQL Response:', rawSQLResponse);
            console.log('=========================');
        } catch (error) {
            throw new AppError('Hubo un error con la IA generando la consulta.', 500);
        }

        // ================= VALIDACIÓN =================
        const validation = sqlValidator.validate(rawSQLResponse);
        if (!validation.isValid) {
            const replyMsg = `⚠️ Lo siento, no puedo ejecutar esta acción: ${validation.error}`;
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
                historyId: parseInt(currentChatId)
            });
        }

        const cleanSQL = validation.cleanSQL;

        // ================= EJECUCIÓN =================
        let queryResults;
        try {
            const executed = await dbManager.executeQuery(targetDbId, cleanSQL);
            queryResults = executed.rows;
            
            // IMPROVEMENT C: Save successful SQL to cache
            await memoryManager.saveToSQLCache(
                question, 
                cleanSQL, 
                targetDbId, 
                queryResults.slice(0, 5) // Save preview of first 5 rows
            );
        } catch (error) {
             console.log('=== SQL EXECUTION ERROR ===');
             console.log('Error:', error.message);
             console.log('SQL:', cleanSQL);
             console.log('===========================');

             const errorMsgStatus = `🔥 Error en la base de datos: ${error.message}`;
             await Message.create({
                chatId: parseInt(currentChatId),
                role: 'assistant',
                content: errorMsgStatus,
                sqlExecuted: cleanSQL,
                databaseUsed: dbConfig.name
            });
            return res.json({
                success: true,
                reply: `🔥 La base de datos rechazó la consulta: ${error.message}`,
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

        // IMPROVEMENT E: Infer user preferences from patterns
        await memoryManager.inferPreferences(currentChatId, question, cleanSQL);

        res.json({
            success: true,
            reply: finalReply,
            sqlExecuted: cleanSQL,
            historyId: parseInt(currentChatId),
            fromCache: false
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
