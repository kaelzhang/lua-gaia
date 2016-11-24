const express = require('express')
const url = require('url')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())

app.use((req, res) => {
  const uri = url.parse(req.url, true)
  const ret = {
    pathname: uri.pathname,
    query: uri.query,
    headers: req.headers,
    body: req.body
  }

  console.log(ret)
  res.json(ret)
})

app.listen(8081)
