'use strict'

const { Sequelize } = require('sequelize')
const path = require('path')
const fs = require('fs')

module.exports = (database_url) => {
  const sequelize = new Sequelize(database_url)
  const modelsPath = path.join(__dirname, 'models')
  const models = {}

  fs.readdirSync(modelsPath).forEach(file => {
    const modelPath = path.join(modelsPath, file)
    const model = sequelize.import(modelPath)

    models[model.name] = model
  })

  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) models[modelName].associate(models)
  })

  return {
    sequelize,
    Sequelize
  }
}
