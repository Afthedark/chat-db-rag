module.exports = (sequelize, DataTypes) => {
    const ContextRule = sequelize.define('ContextRule', {
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false, // INSTRUCCIONES (prompts de sistema, reglas) o EJEMPLOS_SQL (ejemplos few-shot)
            validate: {
                isIn: [['INSTRUCCIONES', 'EJEMPLOS_SQL', 'SCHEMA', 'FEW_SHOT']]
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        keywords: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: 'Comma-separated keywords para smart matching (ej: "ventas,pedidos,ventas_diarias")'
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Priority score (higher = more important)'
        },
        matchCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Cuántas veces se ha usado esta regla'
        }
    }, {
        indexes: [
            { fields: ['category'] },
            { fields: ['isActive'] },
            { fields: ['priority'] },
            { fields: ['matchCount'] }
        ]
    });
    return ContextRule;
};
