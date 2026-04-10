# MCP Setup Guide for Chat DB RAG

This guide explains how to configure and use the Model Context Protocol (MCP) integration with Chat DB RAG.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables AI assistants to interact with external tools and data sources. With MCP integration, you can use Chat DB RAG capabilities directly from VS Code, Claude Desktop, and other MCP-compatible clients.

## Available MCP Tools

The Chat DB RAG MCP server provides the following tools:

### Connection Management
- `chatdb_list_connections` - List all configured database connections
- `chatdb_test_connection` - Test connectivity to a specific database
- `chatdb_get_connection_schema` - Get the schema description for a connection

### Query Execution
- `chatdb_query` - Execute SQL queries (SELECT/SHOW only)
- `chatdb_natural_query` - Convert natural language to SQL and execute

### Schema Inspection
- `chatdb_list_tables` - List all tables in a database
- `chatdb_describe_table` - Get table structure (columns, types, constraints)
- `chatdb_show_indexes` - Show indexes for a table
- `chatdb_get_table_stats` - Get table statistics (row count, size, etc.)

---

## VS Code Setup

### Prerequisites
- VS Code 1.85 or later
- GitHub Copilot extension installed
- Node.js 18 or later

### Configuration

1. The `.vscode/mcp.json` file is already configured in your project:

```json
{
  "servers": {
    "chat-db-rag": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${workspaceFolder}/backend/mcp/stdio-server.js"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

2. **Reload VS Code** to apply the configuration:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run: `Developer: Reload Window`

3. **Start the MCP Server**:
   - Open Command Palette
   - Run: `MCP: Start Server`
   - Select `chat-db-rag`

4. **Verify the connection**:
   - Open Copilot Chat
   - Try asking: "List my database connections"

### Using MCP in VS Code

Once configured, you can use natural language with Copilot:

```
"Show me all tables in connection 1"
"Describe the pedidos table in connection 1"
"How many orders today?" (uses natural language to SQL)
"Query connection 1: SELECT * FROM items LIMIT 10"
```

---

## Claude Desktop Setup

### Configuration

1. Open Claude Desktop settings:
   - **Windows**: `%APPDATA%/Claude/settings.json`
   - **macOS**: `~/Library/Application Support/Claude/settings.json`

2. Add the Chat DB RAG MCP server configuration:

```json
{
  "mcpServers": {
    "chat-db-rag": {
      "command": "node",
      "args": [
        "C:/Users/edici/Documents/ferca/chat-db-rag/backend/mcp/stdio-server.js"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

4. **Verify**: Look for the hammer icon (tools) in the chat interface

### Using MCP in Claude Desktop

```
"List all my database connections"
"Show me the structure of the items table"
"What are the top 5 products by sales?"
"Execute this query: SELECT COUNT(*) FROM pedidos"
```

---

## Testing with MCP Inspector

The MCP Inspector is a useful tool for testing your MCP server:

### Installation
```bash
npm install -g @modelcontextprotocol/inspector
```

### Run Inspector
```bash
cd backend
npx @modelcontextprotocol/inspector node mcp/stdio-server.js
```

This will open a web interface where you can:
- View all available tools
- Test tool execution
- Inspect requests and responses

---

## Environment Variables

The MCP server uses the same environment variables as the main application:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_MEMORY_PATH` | SQLite database path for storing connections | `./data/memory.sqlite` |
| `AI_PROVIDER` | AI provider (ollama/openrouter) | `ollama` |
| `OLLAMA_URL` | Ollama API URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `qwen2.5-coder:14b` |
| `OPENROUTER_API_KEY` | OpenRouter API key | - |
| `OPENROUTER_MODEL` | OpenRouter model | `qwen/qwen-2.5-coder-32b-instruct` |

Create a `.env` file in the `backend` folder with your settings.

---

## Troubleshooting

### "Connection refused" or "Cannot connect to database"

1. Verify your database connections are configured in the Chat DB RAG web interface
2. Test the connection using `chatdb_test_connection` tool
3. Check that the database server is accessible from your machine

### "MCP Server not starting"

1. Check that Node.js 18+ is installed: `node --version`
2. Verify dependencies are installed: `cd backend && npm install`
3. Check the console for error messages

### "Tool execution failed"

1. Check that the connection ID is correct (use `chatdb_list_connections`)
2. Verify the database connection is active
3. For SQL queries, ensure they are SELECT or SHOW statements only

### VS Code Specific Issues

**MCP commands not appearing:**
- Ensure you have the latest GitHub Copilot extension
- Reload VS Code window after configuration changes
- Check Output panel > GitHub Copilot for errors

**"Server failed to start":**
- Check that the path in `mcp.json` is correct
- Try using absolute path instead of `${workspaceFolder}`
- Verify Node.js is in your system PATH

---

## Security Considerations

1. **Read-Only Access**: The MCP server only allows SELECT and SHOW queries
2. **SQL Validation**: All queries are validated before execution
3. **Connection Security**: Database credentials are stored securely in the SQLite database
4. **No Password Exposure**: Passwords are never returned in API responses

---

## Example Workflows

### Exploring a New Database

1. List connections: `chatdb_list_connections`
2. Test connection: `chatdb_test_connection` with connection ID
3. List tables: `chatdb_list_tables`
4. Describe interesting tables: `chatdb_describe_table`
5. Run queries: `chatdb_query` or `chatdb_natural_query`

### Natural Language Analysis

1. Get connection schema: `chatdb_get_connection_schema`
2. Ask questions in natural language:
   - "How many sales this month?"
   - "Top 10 customers by revenue"
   - "Products with low inventory"

### Schema Documentation

1. List all tables: `chatdb_list_tables`
2. For each table:
   - Describe structure: `chatdb_describe_table`
   - Show indexes: `chatdb_show_indexes`
   - Get stats: `chatdb_get_table_stats`

---

## Next Steps

- See [MCP_TOOLS_REFERENCE.md](./MCP_TOOLS_REFERENCE.md) for detailed tool documentation
- Configure your database connections in the Chat DB RAG web interface
- Add schema descriptions to improve natural language query accuracy
