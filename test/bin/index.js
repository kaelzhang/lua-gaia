const {kill, file} = require('./util')
const server = require('./server')
const nginx = require('./nginx')


function start () {
  return Promise.all([
    kill(file('config/nginx.pid'))
  ])
  .then(() => {
    server()
    return nginx()
  })
  .catch((err) => {
    console.error(err.stack)
  })
}


module.exports = start

if (require.main === module) {
  start()
}
