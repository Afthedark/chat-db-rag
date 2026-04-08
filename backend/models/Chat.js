module.exports = (sequelize, DataTypes) => {
    const Chat = sequelize.define('Chat', {
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        databaseId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });
    return Chat;
};
