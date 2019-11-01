'use strict'

const { Sequelize, Model, DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser')
const chalk = require('chalk')
const dotenv = require('dotenv')
const express = require('express')
var logger = require('morgan')
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

class File extends Model { }

File.init({
  id: {
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    type: DataTypes.INTEGER
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING
  },
  extension: {
    allowNull: false,
    type: DataTypes.STRING
  },
  route: {
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

User.hasMany(Task)
Task.belongsTo(User)

Task.hasMany(File)
File.belongsTo(Task)



const app = express()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))




const jwtSecret = process.env.JWT_SECRET




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





const router = express.Router()

router.post('/signup', (req, res) => {
  let { email, password, name, surname } = req.body
  password = bcrypt.hashSync(password)

  User.create({ email, password, name, surname }).then(user => {
    user = user.get({ plain: true })
    delete user.password

    const token = jwt.sign({ user }, jwtSecret)

    res.send({ token })
  })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body

  User.findOne({ where: { email } }).then(user => {
    if (!user) {
      return res.status(404).send('User not found!')
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).send('Password not valid!')
    }

    user = user.get({ plain: true })
    delete user.password
    const token = jwt.sign({ user }, jwtSecret)

    res.send({ token })
  })
})

router.use(checkToken)

router.post('/tasks', (req, res) => {
  const { title, content, deadline } = req.body
  const { id: userId } = req.decoded.user

  const task = Task.build({ title, content, deadline })

  task.setUser(userId, { save: false })
  task.save().then(task => {
    res.json({ task })
  })
})

router.get('/tasks', (req, res) => {
  const { limit = 10, step = 1, orderBy = 'id', order = 'DESC' } = req.query

  Task.findAndCountAll({
    attributes: { exclude: ['userId'] },
    include: {
      model: User,
      attributes: ['email', 'name', 'surname']
    },
    order: [[orderBy, order]],
    limit,
    offset: (step - 1) * limit
  }).then(({ rows: tasks, count: total }) => {
    const steps = Math.ceil(total / limit)

    res.json({ total, steps, tasks })
  })
})

router.get('/tasks/:id', (req, res) => {
  const { id } = req.params

  Task.findByPk(id, {
    attributes: { exclude: ['userId'] },
    include: {
      model: User,
      attributes: { exclude: ['password'] }
    }
  }).then(task => {
    res.json({ task })
  })
})

router.put('/tasks/:id', (req, res, next) => {
  const { title, content, status, deadline } = req.body
  const { id } = req.params

  Task.update({ title, content, status, deadline }, { where: { id } }).then(() => {
    req.method = 'GET'
    req.url = `/api/v1/tasks/${id}`

    return app._router.handle(req, res, next)
  })
})

router.delete('/tasks/:id', (req, res) => {
  const { id } = req.params

  Task.findByPk(id, { attributes: ['id'] }).then(task => {
    return task.destroy()
  }).then(() => {
    res.json({})
  })
})

app.use('/api/v1', router);


// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
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


  const chance = require('chance')()
  const bulkTasks = []
  for (let i = 0; i < 50; i++) {
    const task = {
      title: chance.sentence({ words: 15 }),
      content: chance.paragraph(),
      deadline: Date.now(),
      userId: user.id
    }
    
    bulkTasks.push(task)
  }

  pro = Task.bulkCreate(bulkTasks)

  const task = Task.build({
    title: 'Task 1',
    content: 'Make a task app with node.js, express, MySQL and VueJs',
    deadline: Date.now()
  })

  Promise.all([task.setUser(user, { save: false }), pro])
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




