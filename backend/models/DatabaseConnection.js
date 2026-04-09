module.exports = (sequelize, DataTypes) => {
    const DatabaseConnection = sequelize.define('DatabaseConnection', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        host: {
            type: DataTypes.STRING,
            allowNull: false
        },
        port: {
            type: DataTypes.INTEGER,
            defaultValue: 3306
        },
        user: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        database: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // NUEVO: Grupo de esquema para compartir ejemplos entre BDs similares
        schemaGroup: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'default'
        }
    });

    return DatabaseConnection;
};
