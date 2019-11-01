'use strict'

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: DataTypes.INTEGER
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING
    },
    content: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    status: {
      allowNull: false,
      type: DataTypes.ENUM('TODO', 'DOING', 'DONE'),
      defaultValue: 'TODO'
    },
    deadline: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'tasks',
    underscored: true
  })

  Task.associate = (models) => {  
    Task.belongsTo(models.User)
    Task.hasMany(models.File)
  }

  return Task
}