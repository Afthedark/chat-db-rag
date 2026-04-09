const { QueryMemory, DatabaseConnection } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const sqlValidator = require('../services/sqlValidator');
const dbManager = require('../services/dbManager');
const aiService = require('../services/aiService');
const { tokenize } = require('../services/queryMemoryService');
const { Op } = require('sequelize');

// GET /api/query-memory - Listar consultas guardadas
const getAll = async (req, res, next) => {
    try {
        const { databaseId, schemaGroup, limit = 50 } = req.query;
        
        const where = {};
        if (databaseId) {
            where.databaseId = parseInt(databaseId);
        }
        if (schemaGroup) {
            where.schemaGroup = schemaGroup;
        }

        const queries = await QueryMemory.findAll({
            where,
            order: [
                ['score', 'DESC'],
                ['usageCount', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            limit: parseInt(limit)
        });

        res.json({ success: true, data: queries });
    } catch (error) {
        next(error);
    }
};

// POST /api/query-memory - Crear nuevo ejemplo
const create = async (req, res, next) => {
    try {
        const { questionText, sqlQuery, databaseId, testFirst = true } = req.body;

        // Validaciones básicas
        if (!questionText || !sqlQuery || !databaseId) {
            throw new AppError('questionText, sqlQuery y databaseId son requeridos', 400);
        }

        if (questionText.length > 1000) {
            throw new AppError('questionText no puede exceder 1000 caracteres', 400);
        }

        // Validar que la base de datos existe y está activa
        const dbConfig = await DatabaseConnection.findByPk(databaseId);
        if (!dbConfig || !dbConfig.isActive) {
            throw new AppError('Base de datos inválida o inactiva', 400);
        }

        // NUEVO: Obtener schemaGroup de la base de datos
        const schemaGroup = dbConfig.schemaGroup || 'default';

        // Validar SQL
        const validation = sqlValidator.validate(sqlQuery);
        if (!validation.isValid) {
            throw new AppError(`SQL inválido: ${validation.error}`, 400);
        }

        let rowsReturned = 0;
        let wasSuccessful = true;

        // Probar SQL si se solicita
        if (testFirst) {
            try {
                const result = await dbManager.executeQuery(databaseId, validation.cleanSQL);
                rowsReturned = result.rows ? result.rows.length : 0;
            } catch (err) {
                throw new AppError(`Error ejecutando SQL: ${err.message}`, 400);
            }
        }

        // Calcular score
        const score = rowsReturned > 0 ? 1.0 : 0.4;

        // Extraer tablas del SQL
        const tablesUsed = [];
        const tableRegex = /(?:FROM|JOIN)\s+(\w+)/gi;
        let match;
        while ((match = tableRegex.exec(sqlQuery)) !== null) {
            if (!tablesUsed.includes(match[1])) {
                tablesUsed.push(match[1]);
            }
        }

        // Tokenizar pregunta
        const questionTokens = tokenize(questionText);

        // Verificar si ya existe (por questionText y schemaGroup)
        const existing = await QueryMemory.findOne({
            where: {
                questionText,
                schemaGroup
            }
        });

        let queryMemory;
        if (existing) {
            // Actualizar
            await existing.update({
                sqlQuery: validation.cleanSQL,
                questionTokens,
                tablesUsed,
                rowsReturned,
                score,
                databaseId, // Actualizar por si cambió la BD específica
                usageCount: existing.usageCount + 1,
                wasSuccessful
            });
            queryMemory = existing;
        } else {
            // Crear nuevo
            queryMemory = await QueryMemory.create({
                questionText,
                questionTokens,
                sqlQuery: validation.cleanSQL,
                tablesUsed,
                rowsReturned,
                score,
                usageCount: 1,
                databaseId,
                schemaGroup, // NUEVO: Guardar schemaGroup
                wasSuccessful
            });
        }

        res.json({ 
            success: true, 
            data: queryMemory,
            message: existing ? 'Ejemplo actualizado' : 'Ejemplo guardado'
        });

    } catch (error) {
        next(error);
    }
};

// PUT /api/query-memory/:id - Editar ejemplo
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { questionText, sqlQuery } = req.body;

        const queryMemory = await QueryMemory.findByPk(id);
        if (!queryMemory) {
            throw new AppError('Ejemplo no encontrado', 404);
        }

        // Validar nuevo SQL si se proporciona
        if (sqlQuery) {
            const validation = sqlValidator.validate(sqlQuery);
            if (!validation.isValid) {
                throw new AppError(`SQL inválido: ${validation.error}`, 400);
            }
            queryMemory.sqlQuery = validation.cleanSQL;
        }

        if (questionText) {
            queryMemory.questionText = questionText;
            queryMemory.questionTokens = tokenize(questionText);
        }

        // Re-extraer tablas si cambió el SQL
        if (sqlQuery) {
            const tablesUsed = [];
            const tableRegex = /(?:FROM|JOIN)\s+(\w+)/gi;
            let match;
            while ((match = tableRegex.exec(sqlQuery)) !== null) {
                if (!tablesUsed.includes(match[1])) {
                    tablesUsed.push(match[1]);
                }
            }
            queryMemory.tablesUsed = tablesUsed;
        }

        await queryMemory.save();

        res.json({ success: true, data: queryMemory });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/query-memory/:id - Eliminar ejemplo
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        const queryMemory = await QueryMemory.findByPk(id);
        if (!queryMemory) {
            throw new AppError('Ejemplo no encontrado', 404);
        }

        await queryMemory.destroy();

        res.json({ success: true, message: 'Ejemplo eliminado' });
    } catch (error) {
        next(error);
    }
};

// POST /api/query-memory/test - Probar SQL sin guardar
const testSQL = async (req, res, next) => {
    try {
        const { sqlQuery, databaseId } = req.body;

        if (!sqlQuery || !databaseId) {
            throw new AppError('sqlQuery y databaseId son requeridos', 400);
        }

        // Validar SQL
        const validation = sqlValidator.validate(sqlQuery);
        if (!validation.isValid) {
            throw new AppError(`SQL inválido: ${validation.error}`, 400);
        }

        // Validar base de datos
        const dbConfig = await DatabaseConnection.findByPk(databaseId);
        if (!dbConfig || !dbConfig.isActive) {
            throw new AppError('Base de datos inválida o inactiva', 400);
        }

        // Ejecutar SQL
        const result = await dbManager.executeQuery(databaseId, validation.cleanSQL);
        
        // Limitar preview a 10 filas
        const previewRows = result.rows.slice(0, 10);

        res.json({
            success: true,
            rowCount: result.rows.length,
            previewRows,
            fields: result.fields,
            cleanSQL: validation.cleanSQL
        });

    } catch (error) {
        next(error);
    }
};

// POST /api/query-memory/generate - Generar SQL con IA
const generateSQL = async (req, res, next) => {
    try {
        const { description, databaseId } = req.body;

        if (!description || !databaseId) {
            throw new AppError('description y databaseId son requeridos', 400);
        }

        // Validar base de datos
        const dbConfig = await DatabaseConnection.findByPk(databaseId);
        if (!dbConfig || !dbConfig.isActive) {
            throw new AppError('Base de datos inválida o inactiva', 400);
        }

        // NUEVO: Obtener schemaGroup para buscar ejemplos similares
        const schemaGroup = dbConfig.schemaGroup || 'default';

        // Extraer esquema dinámico
        let schema = '';
        try {
            schema = await dbManager.extractSchemaForPrompt(databaseId);
        } catch (err) {
            console.warn('⚠️ No se pudo extraer esquema:', err.message);
        }

        // NUEVO: Buscar ejemplos similares del mismo schemaGroup
        let fewShotExamples = '';
        try {
            const { findSimilarQueries } = require('../services/queryMemoryService');
            const similarQueries = await findSimilarQueries(description, schemaGroup, 3);
            if (similarQueries.length > 0) {
                fewShotExamples = '\n\n=== EJEMPLOS SIMILARES ===\n' +
                    similarQueries.map((q, i) => 
                        `-- Ejemplo ${i + 1} (similitud: ${Math.round(q.similarity * 100)}%)\n-- Pregunta: "${q.questionText}"\n${q.sqlQuery}`
                    ).join('\n\n');
            }
        } catch (err) {
            console.warn('⚠️ No se pudieron cargar ejemplos similares:', err.message);
        }

        // Construir prompt para generación
        const systemPrompt = `Eres un experto en MySQL. Genera UNA SOLA consulta SQL SELECT basada en la descripción del usuario.

REGLAS ESTRICTAS:
- Responde ÚNICAMENTE con el código SQL, sin explicaciones
- Solo comandos SELECT, nunca INSERT, UPDATE, DELETE
- La consulta debe terminar con punto y coma
- No uses markdown ni backticks

${schema ? `\n=== ESQUEMA DE LA BASE DE DATOS ===\n${schema}` : ''}${fewShotExamples}`;

        const userPrompt = `Descripción: ${description}`;

        // Generar SQL con IA
        const rawSQL = await aiService.generateResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        // Extraer SQL limpio
        const cleanSQL = sqlValidator.extractFirstSQL(rawSQL);

        res.json({
            success: true,
            sql: cleanSQL,
            raw: rawSQL
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    create,
    update,
    remove,
    testSQL,
    generateSQL
};
