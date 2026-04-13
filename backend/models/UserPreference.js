module.exports = (sequelize, DataTypes) => {
    const UserPreference = sequelize.define('UserPreference', {
        preferenceKey: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: 'Identificador único de la preferencia'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['database', 'query', 'display', 'behavior']]
            },
            comment: 'Categoría de preferencia'
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Valor de la preferencia (puede ser JSON)'
        },
        frequency: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: 'Cuántas veces se ha inferido esta preferencia'
        },
        lastUpdated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Última actualización'
        },
        confidence: {
            type: DataTypes.FLOAT,
            defaultValue: 0.5,
            comment: 'Confianza en esta preferencia (0-1)'
        }
    }, {
        indexes: [
            { fields: ['preferenceKey'] },
            { fields: ['category'] },
            { fields: ['frequency'] }
        ]
    });

    return UserPreference;
};
