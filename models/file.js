'use strict'

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: DataTypes.INTEGER
    },
    originalname: {
      allowNull: false,
      type: DataTypes.STRING
    },
    mimetype: {
      allowNull: false,
      type: DataTypes.STRING
    },
    path: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'files',
    underscored: true,
    timestamps: true,
    updatedAt: false
  })

  File.associate = (models) => {
    File.belongsTo(models.Task)
  }

  return File
}