const {kill, file} = require('./util')
const server = require('./server')
const nginx = require('./nginx')

function fail (err) {
  console.error(err)
  process.exit(1)
}


module.exports = () => {
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
