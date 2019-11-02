'use strict'

const express = require('express')
const myAuthenticate = require('./authenticate')
const myController = require('./controllers/task')
const multer = require('multer')


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, './upload')
   },
  filename: function (req, file, cb) {
      cb(null , file.originalname)
  }
})

const upload = multer({ storage: storage })

module.exports = (app, sequelize) => {
  const { JWT_SECRET: jwtSecret } = process.env
  
  const { User } = sequelize.models
  const authenticate = myAuthenticate(app, jwtSecret, User)
  const controller = myController(app, sequelize)

  app.get('/health-check', (req, res) => {
    res.send('ok')
  })

  const router = express.Router()

  router.post('/tasks', authenticate, upload.array('files'), controller.create)

  router.get('/tasks', authenticate, controller.list)

  router.get('/tasks/:id', authenticate, controller.get)

  router.put('/tasks/:id', authenticate, upload.array('files'), controller.update)

  router.delete('/tasks/:id', authenticate, controller.destroy)

  router.post('/array', authenticate, (req, res) => {
    const { myArry, element } = req.body

    let index = myArry.indexOf(element) 

    if (index == -1 ) {
      index = myArry.length
    }

    res.send({ index })
  })

  app.use('/api/v1', router)
}