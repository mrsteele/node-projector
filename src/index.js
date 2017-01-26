'use strict'

const basicAuth = require('basic-auth-connect')
const addresses = require('os').networkInterfaces()
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

module.exports = (app, config = {}) => {
  config = Object.assign({
    port: 3000,
    rootPath: '/',
    cmdPath: '/cmd'
  }, config)

  const server = require('http').Server(app)
  const io = require('socket.io')(server)

  let address = ''
  Object.keys(addresses).forEach(function (ifname) {
    var alias = 0

    addresses[ifname].forEach(function (iface) {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        Logger.warn('Additional address detected: ' + ifname + ':' + alias, iface.address)
      } else {
        // this interface has only one ipv4 adress
        address = iface.address
        Logger.info(`Single address detected: ${address}`)
      }
      ++alias
    })
  })

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

  const ipaddress = `${address}:${config.port}`
  const render = (template, res) => {
    hbs.engine(path.resolve(__dirname, `views/${template}.hbs`), { layout: 'main', ipaddress: ipaddress }, (err, html) => {
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

  // listen
  server.listen(config.port, () => {
    Logger.info(`node-projector on port: ${config.port}`)
    Logger.info(`To access the command module, go to ${address}:${config.port}/cmd`)
  })
}
