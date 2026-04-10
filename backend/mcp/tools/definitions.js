/**
 * MCP Tool Definitions for Chat DB RAG
 * Defines all available tools for the MCP server
 */

const tools = [
    {
        name: 'chatdb_list_connections',
        description: 'List all configured database connections in the Chat DB RAG system',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'chatdb_test_connection',
        description: 'Test connectivity to a specific database connection',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection to test'
                }
            },
            required: ['connectionId']
        }
    },
    {
        name: 'chatdb_query',
        description: 'Execute a SQL query on a specific database connection. Only SELECT and SHOW queries are allowed.',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection to query'
                },
                query: {
                    type: 'string',
                    description: 'The SQL query to execute (SELECT or SHOW only)'
                },
                parameters: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'Optional parameters for prepared statements'
                }
            },
            required: ['connectionId', 'query']
        }
    },
    {
        name: 'chatdb_list_tables',
        description: 'List all tables in the specified database',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection'
                }
            },
            required: ['connectionId']
        }
    },
    {
        name: 'chatdb_describe_table',
        description: 'Get the structure/schema of a specific table including columns, types, and constraints',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection'
                },
                table: {
                    type: 'string',
                    description: 'The name of the table to describe'
                }
            },
            required: ['connectionId', 'table']
        }
    },
    {
        name: 'chatdb_show_indexes',
        description: 'Show all indexes for a specific table',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection'
                },
                table: {
                    type: 'string',
                    description: 'The name of the table'
                }
            },
            required: ['connectionId', 'table']
        }
    },
    {
        name: 'chatdb_get_table_stats',
        description: 'Get statistics about a table including row count, size, and other metadata',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection'
                },
                table: {
                    type: 'string',
                    description: 'The name of the table'
                }
            },
            required: ['connectionId', 'table']
        }
    },
    {
        name: 'chatdb_natural_query',
        description: 'Convert a natural language question to SQL and execute it using the AI system. The database schema description will be used to generate accurate queries.',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection'
                },
                question: {
                    type: 'string',
                    description: 'The question in natural language (e.g., "How many orders today?", "Top 5 products by sales")'
                }
            },
            required: ['connectionId', 'question']
        }
    },
    {
        name: 'chatdb_get_connection_schema',
        description: 'Get the schema description for a database connection that is used by the AI for natural language queries',
        inputSchema: {
            type: 'object',
            properties: {
                connectionId: {
                    type: 'number',
                    description: 'The ID of the database connection'
                }
            },
            required: ['connectionId']
        }
    }
];

module.exports = { tools };
