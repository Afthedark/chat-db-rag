/**
 * MCP Tools Index
 * Exports all tool definitions and handler mappings
 */

const { tools } = require('./definitions');
const connectionHandlers = require('../handlers/connection');
const queryHandlers = require('../handlers/query');
const schemaHandlers = require('../handlers/schema');

/**
 * Map of tool names to their handler functions
 */
const toolHandlers = {
    // Connection tools
    chatdb_list_connections: connectionHandlers.handleListConnections,
    chatdb_test_connection: connectionHandlers.handleTestConnection,
    chatdb_get_connection_schema: connectionHandlers.handleGetConnectionSchema,
    
    // Query tools
    chatdb_query: queryHandlers.handleQuery,
    chatdb_natural_query: queryHandlers.handleNaturalQuery,
    
    // Schema tools
    chatdb_list_tables: schemaHandlers.handleListTables,
    chatdb_describe_table: schemaHandlers.handleDescribeTable,
    chatdb_show_indexes: schemaHandlers.handleShowIndexes,
    chatdb_get_table_stats: schemaHandlers.handleGetTableStats
};

/**
 * Get all tool definitions
 */
function getTools() {
    return tools;
}

/**
 * Execute a tool by name
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Arguments for the tool
 * @returns {Promise<object>} - Tool execution result
 */
async function executeTool(toolName, args) {
    const handler = toolHandlers[toolName];
    
    if (!handler) {
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    return await handler(args);
}

module.exports = {
    getTools,
    executeTool,
    tools,
    toolHandlers
};
