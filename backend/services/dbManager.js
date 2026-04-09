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

module.exports = {
    getConnection,
    executeQuery,
    testConnection,
    removePool,
    closeAll
};
