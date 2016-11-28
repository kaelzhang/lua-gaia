module.exports = compile

const handlebars = require('handlebars')
const fse = require('fs-extra')
const fs = require('fs')
const {
  file,
  read
} = require('./util')

function compile () {
  return read(file('config/redis.hb'))
  .then((content) => {
    const template = handlebars.compile(content)
    const data = {
      'redis-pid-file': file('config/redis.pid')
    }

    return new Promise((resolve, reject) => {
      fse.write(file('config/redis.conf'), template(data), (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  })
}
