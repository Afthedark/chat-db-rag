module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        role: {
            type: DataTypes.ENUM('user', 'assistant'),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        sqlExecuted: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        databaseUsed: {
            type: DataTypes.STRING,
            allowNull: true
        },
        chatId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        tokenUsage: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Estimated token usage for this message'
        },
        embedding: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON array of embedding vector (if generated)'
        },
        isSummarized: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this message was part of a summary'
        }
    }, {
        indexes: [
            { fields: ['chatId'] },
            { fields: ['createdAt'] },
            { fields: ['role'] },
            { fields: ['databaseUsed'] }
        ]
    });
    return Message;
};
