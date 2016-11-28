const spawn = require('cross-spawn')
const {
  file
} = require('../lib/util')

module.exports = () => {
  return new Promise((resolve) => {
    console.log('start openresty.')
    spawn('openresty', [
      '-c',
      file('config/nginx-sample.conf'),
      '-p',
      file()

    ], {
      stdio: 'inherit'
    })
    .on('close', () => {
      resolve()
    })
  })
}
