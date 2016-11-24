const fs = require('fs')
const spawn = require('cross-spawn')
const path = require('path')

function ensure_no_process (pid) {
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
        return reject(
          new Error(`"kill ${pid}" with non-zero exit code ${code}`)
        )
      }

      resolve()
    })
  })
}


function read_pid (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, content) => {
      if (err) {
        // if fails to read, then skip
        return resolve()
      }

      resolve(content.toString().trim())
    })
  })
}



const PROJECT_ROOT = path.join(__dirname, '..', '..')
function file (...paths) {
  return paths.length
    ? path.join(PROJECT_ROOT, ...paths)
    : PROJECT_ROOT
}


function kill (filename) {
  return read_pid(filename)
  .then((pid) => {
    return ensure_no_process(pid)
  })
}


module.exports = {
  file,
  kill
}
