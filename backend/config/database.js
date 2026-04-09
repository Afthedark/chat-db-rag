const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.MEM_DB_NAME || 'ai_memory_db',
    process.env.MEM_DB_USER || 'root',
    process.env.MEM_DB_PASS || '',
    {
        host: process.env.MEM_DB_HOST || 'localhost',
        port: process.env.MEM_DB_PORT || 3306,
        dialect: 'mysql',
        logging: false, // Turn off database logging in console
    }
);

module.exports = sequelize;
