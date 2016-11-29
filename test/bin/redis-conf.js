module.exports = compile

const handlebars = require('handlebars')
const fse = require('fs-extra')
const fs = require('fs')
const {
  file,
  read
} = require('../lib/util')

function compile () {
  return read(file('config/redis.hb'))
  .then((content) => {
    const template = handlebars.compile(content)
    const data = {
      root: file()
    }

    const config = template(data)
    return new Promise((resolve, reject) => {
      fse.writeFile(file('config/redis.conf'), config, (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  })
}
