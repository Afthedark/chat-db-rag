/**
 * MCP Schema Handlers
 * Handles database schema inspection tools
 */

const { DatabaseConnection } = require('../../models');
const dbManager = require('../../services/dbManager');

/**
 * List all tables in the database
 */
async function handleListTables(args) {
    try {
        const { connectionId } = args;

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

        // Query to list all tables
        const result = await dbManager.executeQuery(
            connectionId,
            "SHOW TABLES"
        );

        // Extract table names from result
        const tableKey = Object.keys(result.rows[0] || {})[0] || 'Tables_in_' + dbConfig.database;
        const tables = result.rows.map(row => row[tableKey] || row[Object.keys(row)[0]]);

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
                        tableCount: tables.length,
                        tables: tables
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
                        error: `Failed to list tables: ${error.message}`
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

/**
 * Describe the structure of a specific table
 */
async function handleDescribeTable(args) {
    try {
        const { connectionId, table } = args;

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

        // Validate table name to prevent injection
        const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, '');
        if (sanitizedTable !== table) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Invalid table name provided'
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        // Get table structure
        const result = await dbManager.executeQuery(
            connectionId,
            `DESCRIBE \`${sanitizedTable}\``
        );

        // Format columns
        const columns = result.rows.map(row => ({
            field: row.Field,
            type: row.Type,
            nullable: row.Null === 'YES',
            key: row.Key,
            default: row.Default,
            extra: row.Extra
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        connection: {
                            id: dbConfig.id,
                            name: dbConfig.name
                        },
                        table: sanitizedTable,
                        columnCount: columns.length,
                        columns: columns
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
                        error: `Failed to describe table: ${error.message}`,
                        table: args.table
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

/**
 * Show indexes for a specific table
 */
async function handleShowIndexes(args) {
    try {
        const { connectionId, table } = args;

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

        // Validate table name
        const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, '');
        if (sanitizedTable !== table) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Invalid table name provided'
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        // Get indexes
        const result = await dbManager.executeQuery(
            connectionId,
            `SHOW INDEX FROM \`${sanitizedTable}\``
        );

        // Format indexes
        const indexes = result.rows.map(row => ({
            name: row.Key_name,
            column: row.Column_name,
            unique: row.Non_unique === 0,
            type: row.Index_type,
            cardinality: row.Cardinality,
            nullable: row.Null === 'YES'
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        connection: {
                            id: dbConfig.id,
                            name: dbConfig.name
                        },
                        table: sanitizedTable,
                        indexCount: indexes.length,
                        indexes: indexes
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
                        error: `Failed to show indexes: ${error.message}`,
                        table: args.table
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

/**
 * Get table statistics
 */
async function handleGetTableStats(args) {
    try {
        const { connectionId, table } = args;

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

        // Validate table name
        const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, '');
        if (sanitizedTable !== table) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: 'Invalid table name provided'
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        // Get table stats using INFORMATION_SCHEMA
        const statsQuery = `
            SELECT 
                TABLE_NAME,
                TABLE_ROWS,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb,
                DATA_LENGTH,
                INDEX_LENGTH,
                CREATE_TIME,
                UPDATE_TIME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        `;

        const result = await dbManager.executeQuery(connectionId, statsQuery);

        if (result.rows.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `Table '${sanitizedTable}' not found in database`
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }

        const stats = result.rows[0];

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        connection: {
                            id: dbConfig.id,
                            name: dbConfig.name
                        },
                        table: sanitizedTable,
                        statistics: {
                            rowCount: stats.TABLE_ROWS,
                            sizeMB: stats.size_mb,
                            dataLength: stats.DATA_LENGTH,
                            indexLength: stats.INDEX_LENGTH,
                            createTime: stats.CREATE_TIME,
                            updateTime: stats.UPDATE_TIME
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
                        error: `Failed to get table stats: ${error.message}`,
                        table: args.table
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}

module.exports = {
    handleListTables,
    handleDescribeTable,
    handleShowIndexes,
    handleGetTableStats
};
