# MCP Tools Reference

Complete reference for all MCP tools available in Chat DB RAG.

---

## Connection Management Tools

### `chatdb_list_connections`

List all configured database connections in the Chat DB RAG system.

**Parameters**: None

**Returns**:
```json
{
  "success": true,
  "count": 2,
  "connections": [
    {
      "id": 1,
      "name": "Production DB",
      "host": "172.21.22.250",
      "port": 3306,
      "database": "pv_mchicken",
      "user": "root",
      "isActive": true,
      "hasDescription": true
    }
  ]
}
```

**Example Usage**:
```
"List all my database connections"
```

---

### `chatdb_test_connection`

Test connectivity to a specific database connection.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection to test |

**Returns**:
```json
{
  "success": true,
  "message": "Successfully connected to Production DB (172.21.22.250:3306/pv_mchicken)",
  "connection": {
    "id": 1,
    "name": "Production DB",
    "host": "172.21.22.250",
    "port": 3306,
    "database": "pv_mchicken"
  }
}
```

**Example Usage**:
```
"Test connection 1"
```

---

### `chatdb_get_connection_schema`

Get the schema description for a database connection that is used by the AI for natural language queries.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection |

**Returns**:
```json
{
  "success": true,
  "connectionId": 1,
  "name": "Production DB",
  "hasSchemaDescription": true,
  "schemaDescription": "=== ESTRUCTURA DE BASE DE DATOS ===\nTABLA: pedidos..."
}
```

**Example Usage**:
```
"Get schema for connection 1"
```

---

## Query Execution Tools

### `chatdb_query`

Execute a SQL query on a specific database connection. Only SELECT and SHOW queries are allowed.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection |
| `query` | string | Yes | The SQL query (SELECT or SHOW only) |
| `parameters` | array | No | Optional parameters for prepared statements |

**Returns**:
```json
{
  "success": true,
  "connection": {
    "id": 1,
    "name": "Production DB",
    "database": "pv_mchicken"
  },
  "query": "SELECT * FROM pedidos LIMIT 5",
  "rowCount": 5,
  "columns": ["pedido_id", "fecha", "cliente_id", "total", "estado"],
  "rows": [
    {
      "pedido_id": 1,
      "fecha": "2024-01-15T10:30:00.000Z",
      "cliente_id": 123,
      "total": 150.50,
      "estado": "CONCLUIDO"
    }
  ]
}
```

**Example Usage**:
```
"Query connection 1: SELECT COUNT(*) FROM pedidos WHERE estado != 'ANULADO'"
```

**Security Notes**:
- Only SELECT and SHOW statements are allowed
- Queries are validated before execution
- Multiple statements are not supported

---

### `chatdb_natural_query`

Convert a natural language question to SQL and execute it using the AI system.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection |
| `question` | string | Yes | Question in natural language |

**Returns**:
```json
{
  "success": true,
  "connection": {
    "id": 1,
    "name": "Production DB"
  },
  "question": "How many orders today?",
  "generatedSQL": "SELECT COUNT(*) as total FROM pedidos WHERE DATE(fecha) = CURDATE() AND estado != 'ANULADO'",
  "rowCount": 1,
  "columns": ["total"],
  "rows": [
    {
      "total": 45
    }
  ]
}
```

**Example Usage**:
```
"Ask connection 1: How many orders today?"
"Connection 1: Top 5 products by sales"
"What are the total sales this month?"
```

**Important**: For best results, configure a schema description for your connection in the database settings.

---

## Schema Inspection Tools

### `chatdb_list_tables`

List all tables in the specified database.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection |

**Returns**:
```json
{
  "success": true,
  "connection": {
    "id": 1,
    "name": "Production DB",
    "database": "pv_mchicken"
  },
  "tableCount": 15,
  "tables": [
    "pedidos",
    "lin_pedidos",
    "items",
    "clientes",
    "empleados"
  ]
}
```

**Example Usage**:
```
"List tables in connection 1"
"Show me all tables"
```

---

### `chatdb_describe_table`

Get the structure/schema of a specific table including columns, types, and constraints.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection |
| `table` | string | Yes | The name of the table to describe |

**Returns**:
```json
{
  "success": true,
  "connection": {
    "id": 1,
    "name": "Production DB"
  },
  "table": "pedidos",
  "columnCount": 10,
  "columns": [
    {
      "field": "pedido_id",
      "type": "int(11)",
      "nullable": false,
      "key": "PRI",
      "default": null,
      "extra": "auto_increment"
    },
    {
      "field": "fecha",
      "type": "datetime",
      "nullable": false,
      "key": "",
      "default": null,
      "extra": ""
    }
  ]
}
```

**Example Usage**:
```
"Describe table pedidos in connection 1"
"Show structure of items table"
```

---

### `chatdb_show_indexes`

Show all indexes for a specific table.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection |
| `table` | string | Yes | The name of the table |

**Returns**:
```json
{
  "success": true,
  "connection": {
    "id": 1,
    "name": "Production DB"
  },
  "table": "pedidos",
  "indexCount": 3,
  "indexes": [
    {
      "name": "PRIMARY",
      "column": "pedido_id",
      "unique": true,
      "type": "BTREE",
      "cardinality": 32000,
      "nullable": false
    },
    {
      "name": "idx_fecha",
      "column": "fecha",
      "unique": false,
      "type": "BTREE",
      "cardinality": 1500,
      "nullable": false
    }
  ]
}
```

**Example Usage**:
```
"Show indexes for table pedidos"
"What indexes are on the items table?"
```

---

### `chatdb_get_table_stats`

Get statistics about a table including row count, size, and other metadata.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `connectionId` | number | Yes | The ID of the database connection |
| `table` | string | Yes | The name of the table |

**Returns**:
```json
{
  "success": true,
  "connection": {
    "id": 1,
    "name": "Production DB"
  },
  "table": "pedidos",
  "statistics": {
    "rowCount": 32000,
    "sizeMB": 45.23,
    "dataLength": 47360000,
    "indexLength": 524288,
    "createTime": "2023-01-15T08:00:00.000Z",
    "updateTime": "2024-01-15T18:30:00.000Z"
  }
}
```

**Example Usage**:
```
"Get stats for table pedidos"
"Table statistics for items"
```

---

## Common Workflows

### 1. Database Exploration

```
1. chatdb_list_connections
2. chatdb_test_connection (connectionId: 1)
3. chatdb_list_tables (connectionId: 1)
4. chatdb_describe_table (connectionId: 1, table: "pedidos")
5. chatdb_query (connectionId: 1, query: "SELECT * FROM pedidos LIMIT 5")
```

### 2. Natural Language Analysis

```
1. chatdb_get_connection_schema (connectionId: 1)
2. chatdb_natural_query (connectionId: 1, question: "How many orders today?")
3. chatdb_natural_query (connectionId: 1, question: "Top 5 products by sales")
```

### 3. Schema Documentation

```
1. chatdb_list_tables (connectionId: 1)
2. For each table:
   - chatdb_describe_table (connectionId: 1, table: "...")
   - chatdb_show_indexes (connectionId: 1, table: "...")
   - chatdb_get_table_stats (connectionId: 1, table: "...")
```

---

## Error Handling

All tools return a consistent error format:

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

Common errors:
- `Connection with ID X not found` - Invalid connection ID
- `Connection X is inactive` - Connection is disabled
- `SQL validation failed` - Query contains non-allowed statements
- `Query execution failed` - Database error during query execution

---

## Tips for Best Results

1. **Configure Schema Descriptions**: Add detailed schema descriptions to your connections for better natural language query results
2. **Test Connections First**: Use `chatdb_test_connection` before running complex queries
3. **Use Natural Language**: The AI can handle complex questions like "Top 5 products by revenue this month excluding cancelled orders"
4. **Inspect Schema**: Use schema tools to understand database structure before querying
