const express = require('express')
const url = require('url')
const bodyParser = require('body-parser')
const uuid = require('uuid')
const fs = require('fs')
const fse = require('fs-extra')
const {
  file
} = require('./util')


module.exports = () => {
  console.log('start server.')

  const app = express()
  app.use(bodyParser.json())

  app.use((req, res) => {
    const uri = url.parse(req.url, true)

    const headers = req.headers

    header.id = uuid.v4()

    const ret = {
      pathname: uri.pathname,
      query: uri.query,
      headers,
      body: req.body
    }

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
