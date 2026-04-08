module.exports = (sequelize, DataTypes) => {
    const ContextRule = sequelize.define('ContextRule', {
        key: { 
            type: DataTypes.STRING, 
            allowNull: false, 
            unique: true 
        },
        category: { 
            type: DataTypes.STRING, 
            allowNull: false // e.g. PROMPT_SISTEMA, ESTRUCTURA_DB, EJEMPLO_SQL, PROMPT_NEGOCIO
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
