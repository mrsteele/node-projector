'use strict'

const basicAuth = require('basic-auth-connect')
const winston = require('winston')
const handlebars = require('node-handlebars')
const path = require('path')
const hbs = handlebars.create({
  layoutsDir: path.resolve(__dirname, 'views/layouts')
})
const Logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
})

module.exports = (server, app, config = {}) => {
  config = Object.assign({
    rootPath: '/',
    cmdPath: '/cmd'
  }, config)

  const io = require('socket.io')(server)

  if (config.authUsername && config.authPassword) {
    Logger.warn('Authentication created')
    app.use(config.cmdPath, basicAuth(config.authUsername, config.authPassword))
  }

  // sockets
  let lastMessage
  let connectionCount = 0
  io.on('connection', (socket) => {
    Logger.info(`IO: Client connected`)
    socket.on('cmd', (msg) => {
      Logger.info(`IO: ${msg}`)
      lastMessage = msg
      io.emit('cmd', msg)
    })

    socket.on('disconnect', () => {
      connectionCount--
      Logger.info('IO: Client disconnected')
      io.emit('clientcount', connectionCount)
    })

    if (lastMessage) {
      socket.emit('cmd', lastMessage)
    }

    connectionCount++
    io.emit('clientcount', connectionCount)
  })

  const render = (template, res) => {
    hbs.engine(path.resolve(__dirname, `views/${template}.hbs`), { layout: 'main' }, (err, html) => {
      if (err) {
        Logger.error(err)
        res.status(500).end()
      } else {
        res.send(html)
      }
    })
  }

  // routes
  app.get(config.cmdPath, (req, res) => {
    render('command', res)
  })

  app.get(config.rootPath, (req, res) => {
    render('index', res)
  })
}
