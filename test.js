const app = require('express')()
const server = require('http').Server(app)
const nodeProjector = require('./src')

nodeProjector(server, app, {
  authUsername: 'bob',
  authPassword: 'says'
})

server.listen(3000, () => {
  console.log('server running!')
})
