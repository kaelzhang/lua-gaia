const express = require('express')
const url = require('url')
const bodyParser = require('body-parser')
const uuid = require('uuid')


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


  app.listen(8081)
}
