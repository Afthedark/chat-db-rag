module.exports = (sequelize, DataTypes) => {
    const SQLCache = sequelize.define('SQLCache', {
        questionHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'Hash de la pregunta para lookup rápido'
        },
        question: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Pregunta original (para debugging y analytics)'
        },
        sqlQuery: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'SQL generado y validado'
        },
        databaseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'ID de la base de datos donde se ejecutó'
        },
        resultPreview: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Preview de los primeros resultados (JSON, max 500 chars)'
        },
        useCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: 'Cuántas veces se ha reutilizado este SQL'
        },
        lastUsed: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Última vez que se usó este cache entry'
        },
        similarityScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Score de similitud si fue encontrado por embedding similarity'
        }
    }, {
        indexes: [
            { fields: ['questionHash'] },
            { fields: ['databaseId'] },
            { fields: ['useCount'] },
            { fields: ['lastUsed'] }
        ]
    });

    return SQLCache;
};
