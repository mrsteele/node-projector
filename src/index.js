var app = require('express')()
var server = require('http').Server(app)
var exphbs = require('express-handlebars')
var io = require('socket.io')(server)
var addresses = require('os').networkInterfaces()
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
      console.log(ifname + ':' + alias, iface.address)
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address)
      address = iface.address
    }
    ++alias
  })
})

// configure app
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}))
app.set('view engine', 'handlebars')

// sockets
let lastMessage
let connectionCount = 0
io.on('connection', (socket) => {
  console.log(`IO: Client connected`)
  socket.on('cmd', (msg) => {
    console.log(`IO: ${msg}`)
    lastMessage = msg
    io.emit('cmd', msg)
  })

  socket.on('disconnect', () => {
    connectionCount--
    console.log('IO: Client disconnected')
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
  console.log('Example app listening on port 3000!')
})
