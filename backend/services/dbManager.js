const mysql = require('mysql2/promise');
const { DatabaseConnection } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// pool object to reuse connections
const pools = new Map();

const getConnection = async (databaseId) => {
    if (pools.has(databaseId)) {
        return pools.get(databaseId);
    }

    // Fetch Database Info
    const dbConfig = await DatabaseConnection.findByPk(databaseId);
    if (!dbConfig) {
        throw new AppError('Base de datos no encontrada.', 404);
    }
    
    if (!dbConfig.isActive) {
        throw new AppError('La conexión a la base de datos está inactiva.', 400);
    }

    try {
        const pool = mysql.createPool({
            host: dbConfig.host,
            port: dbConfig.port || 3306,
            user: dbConfig.user,
            password: dbConfig.password || '',
            database: dbConfig.database,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            multipleStatements: false // Important feature to avoid extra injections
        });

        pools.set(databaseId, pool);
        return pool;
    } catch (error) {
        throw new AppError(`Error creando connection pool: ${error.message}`, 500);
    }
};

const executeQuery = async (databaseId, sql) => {
    const pool = await getConnection(databaseId);
    
    try {
        // En mysql2, el primer elemento del arreglo son las filas (rows) y el segundo los campos (fields)
        const [rows, fields] = await pool.query({
            sql, 
            timeout: 30000 // 30 seconds wait timeout
        });
        return { rows, fields: fields.map(f => f.name) };
    } catch (error) {
        console.error('SQL EXECUTION ERROR:', error.message);
        throw new AppError(`Error ejecutando la consulta en la DB destino: ${error.message}`, 500);
    }
};

const testConnection = async (dbConfig) => {
    let pool = null;
    try {
        pool = await mysql.createPool({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password || '',
            port: dbConfig.port || 3306,
            database: dbConfig.database,
            connectionLimit: 1
        });
        
        await pool.query('SELECT 1');
        return true;
    } catch (error) {
        throw new Error(error.message);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
};

const removePool = (databaseId) => {
    if (pools.has(databaseId)) {
        const pool = pools.get(databaseId);
        pool.end();
        pools.delete(databaseId);
    }
};

const closeAll = async () => {
    for (let pool of pools.values()) {
        await pool.end();
    }
    pools.clear();
};

// Schema cache with TTL
const schemaCache = new Map(); // { databaseId: { schema: string, timestamp: number } }
const SCHEMA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract database schema in a compact format optimized for LLM prompts
 * @param {number} databaseId - Database connection ID
 * @param {number} maxTables - Maximum number of tables to include
 * @returns {Promise<string>} - Compact schema string
 */
const extractSchemaForPrompt = async (databaseId, maxTables = 15) => {
    // Check cache first
    const cached = schemaCache.get(databaseId);
    if (cached && (Date.now() - cached.timestamp) < SCHEMA_CACHE_TTL) {
        console.log(`📋 Schema cache HIT for DB ${databaseId}`);
        return cached.schema;
    }

    const pool = await getConnection(databaseId);
    
    try {
        // 1. Get table list
        const [tables] = await pool.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]).slice(0, maxTables);
        
        if (tableNames.length === 0) {
            return '';
        }

        const schemaLines = [];
        
        // 2. Describe each table
        for (const tableName of tableNames) {
            try {
                const [columns] = await pool.query(`DESCRIBE \`${tableName}\``);
                
                const colDefs = columns.map(col => {
                    let def = col.Field;
                    // Add type (simplified)
                    const type = col.Type.replace(/\(\d+\)/g, '').toUpperCase();
                    def += ` ${type}`;
                    // Mark primary key
                    if (col.Key === 'PRI') def += ' PK';
                    // Mark foreign key hint
                    if (col.Key === 'MUL') def += ' FK';
                    // Mark not null (skip for PKs)
                    if (col.Null === 'NO' && col.Key !== 'PRI') def += ' NOT NULL';
                    return def;
                });
                
                schemaLines.push(`${tableName}(${colDefs.join(', ')})`);
            } catch (descError) {
                console.warn(`Warning: Could not describe table ${tableName}:`, descError.message);
            }
        }
        
        let schema = schemaLines.join('\n');
        
        // 3. Truncate if too long (4000 chars max)
        if (schema.length > 4000) {
            schema = schema.substring(0, 4000) + '\n... [schema truncado]';
        }
        
        // 4. Cache the result
        schemaCache.set(databaseId, { schema, timestamp: Date.now() });
        console.log(`📋 Schema extracted for DB ${databaseId}: ${tableNames.length} tables, ${schema.length} chars`);
        
        return schema;
    } catch (error) {
        console.error('Error extracting schema:', error.message);
        return '';
    }
};

module.exports = {
    getConnection,
    executeQuery,
    testConnection,
    removePool,
    closeAll,
    extractSchemaForPrompt
};
