'use strict'

const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const express = require('express')
const logger = require('morgan')

const mySequelize = require('./sequelize')
const myRoutes = require('./router')

dotenv.config()

const {
  DATABASE_URL: database_url,
  PORT: port
} = process.env

const { sequelize } = mySequelize(database_url)
const { models: { User, Task, File } } = sequelize

const app = express()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

myRoutes(app, sequelize)

sequelize.authenticate().then(() => {
  console.log('DATABASE: connected')

  return sequelize.sync({ })
}).then(() => {
  console.log('DATABASE: force')
}).catch(err => {
  console.error('DATABASE: error:')
  console.error(err)
})

app.listen(port, () => {
  console.log('App listening on port 3001!')
})




