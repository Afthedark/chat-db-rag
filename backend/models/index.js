const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = require('./Chat')(sequelize, DataTypes);
const Message = require('./Message')(sequelize, DataTypes);
const ContextRule = require('./ContextRule')(sequelize, DataTypes);
const DatabaseConnection = require('./DatabaseConnection')(sequelize, DataTypes);
// NUEVO: Importar modelo QueryMemory
const QueryMemory = require('./QueryMemory')(sequelize, DataTypes);

// Relationships
Chat.hasMany(Message, { foreignKey: 'chatId', onDelete: 'CASCADE' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });
// QueryMemory es una tabla independiente, sin relaciones

module.exports = {
    sequelize,
    Chat,
    Message,
    ContextRule,
    DatabaseConnection,
    // NUEVO: Exportar QueryMemory
    QueryMemory
};
