const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = require('./Chat')(sequelize, DataTypes);
const Message = require('./Message')(sequelize, DataTypes);
const ContextRule = require('./ContextRule')(sequelize, DataTypes);
const DatabaseConnection = require('./DatabaseConnection')(sequelize, DataTypes);

// Relationships
Chat.hasMany(Message, { onDelete: 'CASCADE' });
Message.belongsTo(Chat);

module.exports = {
    sequelize,
    Chat,
    Message,
    ContextRule,
    DatabaseConnection
};
