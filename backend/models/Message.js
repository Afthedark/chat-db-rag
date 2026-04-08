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
        }
    });
    return Message;
};
