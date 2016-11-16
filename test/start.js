const spawn = require('cross-spawn')
const path = require('path')
const fs = require('fs')

const PROJECT_ROOT = path.join(__dirname, '..')
function root (...paths) {
  return paths.length
    ? path.join(PROJECT_ROOT, ...paths)
    : PROJECT_ROOT
}


function fail (err) {
  console.error(err)
  process.exit(1)
}


console.log('start server')
require('./server')


read(root('config/nginx.pid'))
.then((content) => {
  const pid = content.toString().trim()
  return ensure_no_process(pid)
}, () => {
  return
})
.catch(fail)
.then(() => {

  console.log('start openresty.')
  spawn('openresty', [
    '-c',
    root('config/sample.conf'),
    '-p',
    root()

  ], {
    stdio: 'inherit'
  })
})


function ensure_no_process (pid, callback) {
  if (!pid) {
    return Promise.resolve()
  }

  console.log(`kill ${pid}`)

  return new Promise((resolve, reject) => {
    spawn('kill', [
      pid
    ])
    .on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`"kill ${pid}" with non-zero exit code ${code}`))
      }

      resolve()
    })
  })
}


function read (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(root('config/nginx.pid'), (err, content) => {
      if (err) {
        return reject(err)
      }

      resolve(content)
    })
  })
}
