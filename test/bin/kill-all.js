module.exports = killall

const {kill, file} = require('../lib/util')

function killall () {
  return Promise.all([
    kill(file('config/nginx.pid'), 'nginx'),
    kill(file('config/server.pid'), 'test-server'),
    kill(file('config/redis.pid'), 'redis')
  ])
  .catch(() => {
    return
  })
}


if (require.main === module) {
  killall()
}
