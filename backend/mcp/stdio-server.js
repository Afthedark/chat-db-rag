#!/usr/bin/env node

/**
 * MCP Stdio Server Entry Point
 * Standalone entry point for running the MCP server via stdio transport
 * 
 * Usage:
 *   node mcp/stdio-server.js
 * 
 * Or with npx:
 *   npx @modelcontextprotocol/inspector node mcp/stdio-server.js
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Start the MCP server
const { startMCPServer } = require('./server');

startMCPServer().catch((error) => {
    console.error('[MCP] Fatal error starting server:', error);
    process.exit(1);
});
