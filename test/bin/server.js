module.exports = server

const express = require('express')
const url = require('url')
const bodyParser = require('body-parser')
const fs = require('fs')
const fse = require('fs-extra')
const {
  file
} = require('../lib/util')


function server () {
  console.log('start server.')

  const app = express()
  app.use(bodyParser.json())

  app.use((req, res) => {
    const uri = url.parse(req.url, true)
    const headers = req.headers

    const ret = {
      pathname: uri.pathname,
      query: uri.query,
      headers,
      body: req.body,
      code: parseInt(req.headers.code) || 200
    }

    res.status(parseInt(req.headers.status) || 200)
    res.json(ret)
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
