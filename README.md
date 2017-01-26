# projector.io

A simple way to use node and expressjs to project on the fly any text to a client.

### Installation

Simply use `npm i projector.io --save` to install your dependencies.

### Setup

Setup is done easily. We hook into express to project on specified routes.

```js
const app = require('express')()
const server = require('http').Server(app)
const nodeProjector = require('projector.io')

// defaults listed below
nodeProjector(server, app, {
  rootPath: '/', // the root bath to show the projection screen
  cmdPath: '/cmd' // the command path
  // authUsername: null, (optional) The basic auth username to secure the cmd route
  // authPassword: null (optional) The basic auth password to secure the cmd route
})

server.listen(3000, () => {
  console.log(`node-projector on port: 3000`)
  console.log(`To access the command module, go to localhost:3000/cmd`)
})

```

### License

MIT
