const app = require('express')()
const nodeProjector = require('./src')

nodeProjector(app, {
  authUsername: 'bob',
  authPassword: 'says'
})
