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


class Queue {
  constructor ({interval, max_wait}) {
    this.queue = []
    this.interval = interval
    this.max_wait = max_wait
    this.flush = debounce(this.flush, this.interval, {
      maxWait: this.max_wait
    })
    this.counter = 0
  }

  push (task) {
    task.time = + new Date
    this.queue.push(task)
    return this
  }

  count () {
    return this.counter
  }

  run (task) {
    this.counter ++
    task.json.spent = task.time
      ? + new Date - task.time
      : 0
    task.res.json(task.json)
  }

  flush () {
    const q = [].concat(this.queue)
    this.queue.length = 0

    q.forEach((task) => {
      this.run(task)
    })
  }
}


const queue = new Queue({
  interval: 50,
  max_wait: 1000
})
const slow_queue = new Queue({
  interval: 2000
})


function server () {
  console.log('start server.')

  const app = express()
  app.use(bodyParser.json())

  app.use((req, res) => {
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

    const task = {
      res,
      json
    }

    if (headers['slow-response']) {
      slow_queue.count() > 0
        ? slow_queue.push(task).flush()
        : slow_queue.run(task)
    } else {
      queue.push(task).flush()
    }
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
