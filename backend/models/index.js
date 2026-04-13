const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = require('./Chat')(sequelize, DataTypes);
const Message = require('./Message')(sequelize, DataTypes);
const ContextRule = require('./ContextRule')(sequelize, DataTypes);
const DatabaseConnection = require('./DatabaseConnection')(sequelize, DataTypes);
const SQLCache = require('./SQLCache')(sequelize, DataTypes);
const UserPreference = require('./UserPreference')(sequelize, DataTypes);

// Relationships
Chat.hasMany(Message, { foreignKey: 'chatId', onDelete: 'CASCADE' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });

DatabaseConnection.hasMany(SQLCache, { foreignKey: 'databaseId' });
SQLCache.belongsTo(DatabaseConnection, { foreignKey: 'databaseId' });

module.exports = {
    sequelize,
    Chat,
    Message,
    ContextRule,
    DatabaseConnection,
    SQLCache,
    UserPreference
};
