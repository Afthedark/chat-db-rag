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

// NUEVO: Extrae el esquema DDL dinámico de la base de datos objetivo
const extractSchemaForPrompt = async (databaseId, maxTables = 15) => {
    try {
        const pool = await getConnection(databaseId);

        // 1. Obtener lista de tablas
        const [tables] = await pool.query('SHOW TABLES');
        if (!tables || tables.length === 0) {
            return '';
        }

        // 2. Tomar solo las primeras maxTables
        const tableNames = tables
            .slice(0, maxTables)
            .map(t => Object.values(t)[0]);

        // 3. Para cada tabla, obtener su estructura
        const ddlStatements = [];
        for (const tableName of tableNames) {
            try {
                const [columns] = await pool.query(`DESCRIBE \`${tableName}\``);

                // Construir CREATE TABLE
                const columnDefs = columns.map(col => {
                    let def = `  ${col.Field} ${col.Type}`;
                    if (col.Key === 'PRI') {
                        def += ' PRIMARY KEY';
                    }
                    if (col.Null === 'NO') {
                        def += ' NOT NULL';
                    }
                    return def;
                });

                const ddl = `CREATE TABLE ${tableName} (\n${columnDefs.join(',\n')}\n);`;
                ddlStatements.push(ddl);
            } catch (err) {
                console.warn(`⚠️ No se pudo describir tabla ${tableName}:`, err.message);
            }
        }

        // 4. Unir todos los CREATE TABLE
        let fullSchema = ddlStatements.join('\n\n');

        // 5. Truncar a máximo 8000 caracteres
        const MAX_SCHEMA_LENGTH = 8000;
        if (fullSchema.length > MAX_SCHEMA_LENGTH) {
            fullSchema = fullSchema.substring(0, MAX_SCHEMA_LENGTH) + '\n-- [Esquema truncado por tamaño...]';
        }

        return fullSchema;

    } catch (error) {
        console.error('❌ Error extrayendo esquema:', error.message);
        return '';
    }
};

module.exports = {
    getConnection,
    executeQuery,
    testConnection,
    removePool,
    closeAll,
    // NUEVO: Exportar función de extracción de esquema
    extractSchemaForPrompt
};
