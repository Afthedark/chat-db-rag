/**
 * MCP Query Handlers
 * Handles SQL query execution and natural language queries
 */

const { DatabaseConnection } = require('../../models');
const dbManager = require('../../services/dbManager');
const sqlValidator = require('../../services/sqlValidator');
const promptBuilder = require('../../services/promptBuilder');
const aiService = require('../../services/aiService');

/**
 * Execute a SQL query on a database connection
 */
async function handleQuery(args) {
    try {
        const { connectionId, query, parameters = [] } = args;

        // Validate connection exists
        const dbConfig = await DatabaseConnection.findByPk(connectionId);
        if (!dbConfig) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Connection with ID ${connectionId} not found`
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        if (!dbConfig.isActive) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Connection ${dbConfig.name} is inactive`
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        // Validate SQL query
        const validation = sqlValidator.validate(query);
        if (!validation.isValid) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `SQL validation failed: ${validation.error}`,
                            query: query
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        // Execute query
        const result = await dbManager.executeQuery(connectionId, validation.cleanSQL);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        connection: {
                            id: dbConfig.id,
                            name: dbConfig.name,
                            database: dbConfig.database
                        },
                        query: validation.cleanSQL,
                        rowCount: result.rows.length,
                        columns: result.fields,
                        rows: result.rows
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: `Query execution failed: ${error.message}`,
                        query: args.query
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

/**
 * Execute a natural language query using AI
 */
async function handleNaturalQuery(args) {
    try {
        const { connectionId, question } = args;

        // Validate connection exists
        const dbConfig = await DatabaseConnection.findByPk(connectionId);
        if (!dbConfig) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Connection with ID ${connectionId} not found`
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        if (!dbConfig.isActive) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Connection ${dbConfig.name} is inactive`
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        // Build prompt with schema description
        const { systemPrompt, userPrompt } = await promptBuilder.buildSQLPrompt(
            question, 
            dbConfig.description
        );

        // Generate SQL using AI
        const rawSQLResponse = await aiService.generateResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        // Validate generated SQL
        const validation = sqlValidator.validate(rawSQLResponse);
        if (!validation.isValid) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Generated SQL validation failed: ${validation.error}`,
                            generatedSQL: rawSQLResponse,
                            question: question
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        // Execute the generated SQL
        const result = await dbManager.executeQuery(connectionId, validation.cleanSQL);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        connection: {
                            id: dbConfig.id,
                            name: dbConfig.name,
                            database: dbConfig.database
                        },
                        question: question,
                        generatedSQL: validation.cleanSQL,
                        rowCount: result.rows.length,
                        columns: result.fields,
                        rows: result.rows
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: `Natural query failed: ${error.message}`,
                        question: args.question
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

module.exports = {
    handleQuery,
    handleNaturalQuery
};
