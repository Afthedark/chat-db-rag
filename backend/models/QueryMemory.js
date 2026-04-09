module.exports = (sequelize, DataTypes) => {
  const QueryMemory = sequelize.define('QueryMemory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    questionTokens: {
      type: DataTypes.JSON,
      allowNull: true
    },
    sqlQuery: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tablesUsed: {
      type: DataTypes.JSON,
      allowNull: true
    },
    wasSuccessful: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    rowsReturned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    score: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0
    },
    databaseId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'QueryMemories',
    timestamps: true
  });

  return QueryMemory;
};
