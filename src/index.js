'use strict'

require('dotenv').config({silent: true})

const app = require('express')()
const basicAuth = require('basic-auth-connect')
const server = require('http').Server(app)
const exphbs = require('express-handlebars')
const io = require('socket.io')(server)
const addresses = require('os').networkInterfaces()
const winston = require('winston')
const Logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
})
const port = 3000

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

// configure app
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}))
app.set('view engine', 'handlebars')

if (process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD) {
  Logger.warn('Authentication created')
  app.use('/cmd', basicAuth(process.env.AUTH_USERNAME, process.env.AUTH_PASSWORD))
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

// routes
app.get('/cmd', (req, res) => {
  res.render('command', {
    ipaddress: ipaddress
  })
})

const ipaddress = `${address}:${port}`
app.get('/', (req, res) => {
  res.render('index', {
    ipaddress: ipaddress
  })
})

app.use((req, res) => {
  res.send(404)
})

// listen
server.listen(port, () => {
  Logger.info(`node-projector on port: ${port}`)
  Logger.info(`To access the command module, go to ${address}:${port}/cmd`)
})
