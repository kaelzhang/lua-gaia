module.exports = killall

const {kill, file} = require('./util')

function killall () {
  return Promise.all([
    kill(file('config/nginx.pid')),
    kill(file('config/server.pid')),
    kill('/var/run/redis.pid')
  ])
  .catch(() => {
    return
  })
}


if (require.main === module) {
  killall()
}
