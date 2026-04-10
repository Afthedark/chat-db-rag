/**
 * MCP Server for Chat DB RAG
 * Main server implementation using Model Context Protocol SDK
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError
} = require('@modelcontextprotocol/sdk/types.js');

const { getTools, executeTool } = require('./tools');

/**
 * Create and configure the MCP server
 */
function createMCPServer() {
    const server = new Server(
        {
            name: 'chat-db-rag-mcp-server',
            version: '1.0.0'
        },
        {
            capabilities: {
                tools: {}
            }
        }
    );

    // Handler for listing available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: getTools()
        };
    });

    // Handler for executing tools
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            console.error(`[MCP] Executing tool: ${name}`);
            console.error(`[MCP] Arguments:`, JSON.stringify(args));

            const result = await executeTool(name, args);
            
            console.error(`[MCP] Tool ${name} executed successfully`);
            return result;
        } catch (error) {
            console.error(`[MCP] Error executing tool ${name}:`, error);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            tool: name
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }
    });

    return server;
}

/**
 * Start the MCP server with stdio transport
 */
async function startMCPServer() {
    // Initialize database connection
    const { sequelize } = require('../models');
    
    try {
        await sequelize.authenticate();
        console.error('[MCP] Database connection established successfully');
    } catch (error) {
        console.error('[MCP] Unable to connect to database:', error);
        process.exit(1);
    }

    const server = createMCPServer();
    const transport = new StdioServerTransport();

    console.error('[MCP] Chat DB RAG MCP Server starting...');
    console.error('[MCP] Available tools:', getTools().map(t => t.name).join(', '));

    await server.connect(transport);

    console.error('[MCP] Server connected and ready');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.error('[MCP] Shutting down...');
    const { closeAll } = require('../services/dbManager');
    await closeAll();
    const { sequelize } = require('../models');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('[MCP] Shutting down...');
    const { closeAll } = require('../services/dbManager');
    await closeAll();
    const { sequelize } = require('../models');
    await sequelize.close();
    process.exit(0);
});

module.exports = {
    createMCPServer,
    startMCPServer
};

// If this file is run directly, start the server
if (require.main === module) {
    startMCPServer().catch((error) => {
        console.error('[MCP] Fatal error:', error);
        process.exit(1);
    });
}
