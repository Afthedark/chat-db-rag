/**
 * MCP Connection Handlers
 * Handles database connection-related MCP tools
 */

const { DatabaseConnection } = require('../../models');
const dbManager = require('../../services/dbManager');

/**
 * List all configured database connections
 */
async function handleListConnections() {
    try {
        const databases = await DatabaseConnection.findAll({
            order: [['name', 'ASC']]
        });
        
        const connections = databases.map(db => ({
            id: db.id,
            name: db.name,
            host: db.host,
            port: db.port,
            database: db.database,
            user: db.user,
            isActive: db.isActive,
            hasDescription: !!db.description
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        count: connections.length,
                        connections: connections
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
                        error: error.message
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

/**
 * Test connectivity to a specific database
 */
async function handleTestConnection(args) {
    try {
        const { connectionId } = args;
        
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

        await dbManager.testConnection(dbConfig);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: `Successfully connected to ${dbConfig.name} (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`,
                        connection: {
                            id: dbConfig.id,
                            name: dbConfig.name,
                            host: dbConfig.host,
                            port: dbConfig.port,
                            database: dbConfig.database
                        }
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
                        error: `Connection failed: ${error.message}`
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

/**
 * Get the schema description for a connection
 */
async function handleGetConnectionSchema(args) {
    try {
        const { connectionId } = args;
        
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

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        connectionId: dbConfig.id,
                        name: dbConfig.name,
                        hasSchemaDescription: !!dbConfig.description,
                        schemaDescription: dbConfig.description || 'No schema description configured for this connection. Add a description in the database settings to improve natural language query accuracy.'
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
                        error: error.message
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

module.exports = {
    handleListConnections,
    handleTestConnection,
    handleGetConnectionSchema
};
