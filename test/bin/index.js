const {kill, file} = require('./util')
const server = require('./server')
const nginx = require('./nginx')

function killall () {
  return Promise.all([
    kill(file('config/nginx.pid')),
    kill(file('config/server.pid'))
  ])
  .catch(() => {
    return
  })
}


function start () {
  return Promise.all([
    server(),
    nginx()
  ])
  .catch((err) => {
    console.error(err.stack)
    process.exit(1)
  })
}


module.exports = () => {
  return killall().then(start)
}


if (require.main === module) {
  start()
}
