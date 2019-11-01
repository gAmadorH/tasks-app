'use strict'

const bcrypt = require('bcryptjs')
const createError = require('http-errors')
const jwt = require('jsonwebtoken')

module.exports = (app, jwtSecret, User) => {  
  // validator middleware
  const authenticate = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']

    if (!token) {
      return next(new createError.Unauthorized())
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length)
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return next(new createError.InternalServerError())
      } else {
        req.decoded = decoded
        return next()
      }
    })
  }

  // only register sign up route
  app.post('/signup', (req, res) => {
    const { email, password, name, surname } = req.body
  
    User.create({
      email,
      password: bcrypt.hashSync(password),
      name,
      surname
    }).then(user => {
      user = user.get({ plain: true })
      delete user.password
  
      const token = jwt.sign({ user }, jwtSecret)
  
      res.json({ token })
    })
  })
  
  // only register login route
  app.post('/login', (req, res, next) => {
    const { email, password } = req.body
  
    User.findOne({ where: { email } }).then(user => {
      if (!user) {
        return next(new createError.NotFound())
      }
  
      if (!bcrypt.compareSync(password, user.password)) {
        return next(new createError.Unauthorized())
      }
  
      user = user.get({ plain: true })
      delete user.password

      const token = jwt.sign({ user }, jwtSecret)
  
      res.json({ token })
    })
  })

  return authenticate
}