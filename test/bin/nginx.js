const spawn = require('cross-spawn')
const {
  file
} = require('../lib/util')

module.exports = () => {
  return new Promise((resolve) => {
    const args = [
      '-c',
      file('nginx-sample.conf'),
      '-p',
      file()
    ]

    console.log(`openresty ${args.join(' ')}`)
    spawn('openresty', args, {
      stdio: 'inherit'
    })
    .on('close', () => {
      resolve()
    })
  })
}
