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
                isIn: [['INSTRUCCIONES', 'EJEMPLOS_SQL']]
            }
        }, 
        content: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },
        isActive: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: true 
        }
    });
    return ContextRule;
};
