'use strict'

const { Sequelize, Model, DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser')
const chalk = require('chalk')
const dotenv = require('dotenv')
const express = require('express')
const jwt = require('jsonwebtoken');

dotenv.config()

const sequelize = new Sequelize(process.env.DATABASE_URL)

class User extends Model { }

User.init({
  id: {
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    type: DataTypes.INTEGER
  },
  email: {
    unique: true,
    allowNull: false,
    type: DataTypes.STRING
  },
  password: {
    allowNull: false,
    type: DataTypes.STRING
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING
  },
  surname: {
    allowNull: false,
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'users',
  underscored: true,
  timestamps: true,
  updatedAt: false
})

class Task extends Model { }

Task.init({
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

User.hasMany(Task)
Task.belongsTo(User)




const app = express()
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('hello world')
})






const checkToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization']

  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length)
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: 'Token is not valid'
        })
      } else {
        req.decoded = decoded
        next()
      }
    })
  } else {
    return res.json({
      success: false,
      message: 'Auth token is not supplied'
    })
  }
}











const jwtSecret = process.env.JWT_SECRET

// signup
app.post('/signup', (req, res) => {
  let { email, password, name, surname } = req.body
  password = bcrypt.hashSync(password)

  User.create({ email, password, name, surname }).then(user => {
    const { id } = user
    const token = jwt.sign({ user: { id } }, jwtSecret)

    res.send({ token })
  })
})


// login
app.post('/login', (req, res) => {
  const { email, password: postedPassword } = req.body

  User.findOne({ where: { email } }).then(user => {
    if (!user) {
      return res.status(404).send('User not found!')
    }
    const { id, password } = user
    const result = bcrypt.compareSync(postedPassword, password)
    if (!result) {
      return res.status(401).send('Password not valid!')
    }

    const token = jwt.sign({ user: { id } }, jwtSecret)
    res.send({ token })
  })
})

app.use(checkToken)

// create
app.post('/tasks', (req, res) => {
  const { title, content, deadline } = req.body
  const { id: userId } = req.decoded.user

  const task = Task.build({ title, content, deadline })

  task.setUser(userId, { save: false })
  task.save().then(task => {
    res.json({ task })
  })
})

// get all
app.get('/tasks', (req, res) => {
  Task.findAndCountAll({
    attributes: { exclude: [ 'userId' ] },
    include: {
      model: User,
      attributes: [ 'id', 'name', 'surname' ]
    }
  }).then(({ rows: tasks, count: total }) => {
    res.json({ total, tasks })
  })
})

// get
app.get('/tasks/:id', (req, res) => {
  const { id } = req.params

  Task.findByPk(id, {
    attributes: { exclude: [ 'userId' ] },
    include: {
      model: User,
      attributes: { exclude: [ 'password' ] }
    }
  }).then(task => { 
    res.json({ task })
  })
})

// update
app.put('/tasks/:id', (req, res, next) => {
  const { title, content, status, deadline } = req.body
  const { id } = req.params

  Task.update({ title, content, status, deadline }, { where : { id } }).then(() => {
    req.method = 'GET'
    req.url = `/tasks/${id}`

    return app._router.handle(req, res, next)
  })
})

// delete
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params

  Task.findByPk(id, { attributes: [ 'id' ] }).then(task => { 
    return task.destroy()
  }).then(() => {
    res.json({})
  })
})



sequelize.authenticate().then(() => {
  console.log('DATABASE: connected')

  return sequelize.sync({ force: true })
}).then(() => {
  return User.create({
    email: 'gamadorh93@gmail.com',
    password: bcrypt.hashSync('test'),
    name: 'Gonzalo',
    surname: 'Amador'
  })
}).then(user => {
  console.log({ user })

  const task = Task.build({
    title: 'Task 1',
    content: 'Make a task app with node.js, express, MySQL and VueJs',
    deadline: Date.now()
  })

  task.setUser(user, { save: false })
  return task.save()
}).then(task => {
  console.log(task)
}).catch(err => {
  console.error('DATABASE: error:')
  console.error(err)
})

app.listen(3001, () => {
  console.log('App listening on port 3001!')
})




