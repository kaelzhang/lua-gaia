module.exports = start

const {kill, file} = require('../lib/util')
const server = require('./server')
const nginx = require('./nginx')
const redis_conf = require('./redis-conf')


function start () {
  return Promise.all([
    server(),
    nginx(),
    redis_conf()
  ])
  .catch((err) => {
    console.error(err.stack)
    process.exit(1)
  })
}


function kill_and_start () {
  return killall().then(start)
}


if (require.main === module) {
  start()
}
