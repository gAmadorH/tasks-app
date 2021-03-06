'use strict'

module.exports = (app, sequelize) => {
  const { User, Task, File } = sequelize.models

  const create = (req, res) => {
    const { files } = req
    const { title, content, deadline } = req.body
    const { id: userId } = req.decoded.user

    const task = Task.build({ title, content, deadline })
  
    task.setUser(userId, { save: false })
    task.save().then(task => {
      files.map(async  file => {
        file = await File.create(file)
        await file.setTask(task)
      })

      res.json({ task })
    })
  }
  
  const list = (req, res) => {
    let { limit = 10, step = 1, orderBy = 'id', order = 'DESC' } = req.query
    limit = +limit
    step = +step
  
    Task.findAndCountAll({
      attributes: {
        exclude: ['content'],
        include: [[sequelize.literal('CONCAT(SUBSTRING(content, 1, 75), " ...")'), 'content']]
      },
      include: {
        model: User,
        attributes: ['id', 'name', 'surname']
      },
      order: [[orderBy, order]],
      limit,
      offset: (step - 1) * limit
    }).then(({ rows: tasks, count: total }) => {
      const steps = Math.ceil(total / limit)
  
      res.json({ total, steps, tasks })
    })
  }
  
  const get = (req, res) => {
    const { id } = req.params
  
    Task.findByPk(id, {
      attributes: { exclude: ['userId'] },
      include: [{
        model: User,
        attributes: { exclude: ['password'] }
      }, {
        model: File,
        attributes: { exclude: ['TaskId', 'path', 'mimetype'] }
      }]
    }).then(task => {
      res.json({ task })
    })
  }
  
  const update = (req, res, next) => {
    const { files } = req
    const { title, content, status, deadline } = req.body
    const { id } = req.params
  
    Task.update({ title, content, status, deadline }, { where: { id } }).then(() => {
      files.map(async  file => {
        file = await File.create(file)
        await file.setTaskId(id)
      })

      req.method = 'GET'
      req.url = `/api/v1/tasks/${id}`
  
      return app._router.handle(req, res, next)
    })
  }
  
  const destroy = (req, res) => {
    const { id } = req.params
  
    Task.findByPk(id, { attributes: ['id'] }).then(async task => {
      const files = await task.getFiles()

      files.map(async  file => {
        await file.destroy()
      })

      return task.destroy()
    }).then(() => {
      res.json({})
    })
  }

  return {
    create,
    list,
    get,
    update,
    destroy
  }
}