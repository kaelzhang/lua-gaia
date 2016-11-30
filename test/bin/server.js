module.exports = server

const express = require('express')
const url = require('url')
const bodyParser = require('body-parser')
const fs = require('fs')
const fse = require('fs-extra')
const {
  file
} = require('../lib/util')
const {
  debounce
} = require('lodash')


const queue = []

const flush_queue = debounce(() => {
  const q = [].concat(queue)
  queue.length = 0

  q.forEach(({res, json}) => {
    res.json(json)
  })
}, 50, {
  maxWait: 1000
})


function server () {
  console.log('start server.')

  const app = express()
  app.use(bodyParser.json())

  app.use((req, res) => {
  console.log(req.url)
    const uri = url.parse(req.url, true)
    const headers = req.headers

    fse.outputFileSync(file('logs/server-access.log'), `${req.method}:${req.url}\n`, {
      flag: 'a'
    })

    if (headers['turn-on-test-log']) {
      fse.outputFileSync(file('logs/server.log'), `${headers.id}\n`, {
        flag: 'a'
      })
    }

    const json = {
      pathname: uri.pathname,
      query: uri.query,
      headers,
      method: req.method,
      body: req.body,
      code: parseInt(req.headers.code) || 200
    }

    res.status(parseInt(req.headers.status) || 200)
    queue.push({
      res,
      json
    })

    flush_queue()
  })

  const filename = file('config/server.pid')

  try {
    fs.writeFileSync(filename, process.pid)
  } catch (e) {
  }

  process.on('exit', () => {
    try {
      fse.removeSync(filename)
    } catch (e) {
    }
  })

  return new Promise((resolve) => {
    app.listen(8081, () => {
      resolve()
    })
  })
}


if (require.main === module) {
  server()
}
