var app = require('express')()
var server = require('http').Server(app)
var exphbs = require('express-handlebars')
var io = require('socket.io')(server)

// configure app
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}))
app.set('view engine', 'handlebars')

// sockets
let lastMessage
io.on('connection', (socket) => {
  console.log(`IO: Client connected`)
  socket.on('cmd', (msg) => {
    console.log(`IO: ${msg}`)
    lastMessage = msg
    io.emit('cmd', msg)
  })

  if (lastMessage) {
    socket.emit('cmd', lastMessage)
  }
})

// routes
app.get('/cmd', (req, res) => {
  res.render('command')
})

app.get('/', (req, res) => {
  res.render('index')
})

app.use((req, res) => {
  res.send(404)
})

// listen
server.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})
