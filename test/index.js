const test = require('ava')
const Visit = require('./lib/visit')
const server = require('./bin')

const BACKEND_HOST = 'http://127.0.0.1:8080'

const CASES = [
  {
    url: '/',
    cache: true,
    expires: false
  },

  {
    url: '/expires-1s',
    expires: 1000,
    cache: true
  }
]

test.before('start up', async () => {
  await server()
})


CASES.forEach(({url, cache, expires, only, headers, method, body}) => {
  const _test = only
    ? test.cb.only
    : test.cb

  url = BACKEND_HOST + url

  _test(`${url}, cache:${cache}, expires:${expires}`, t => {
    const v = new Visit({
      url,
      method,
      headers,
      body
    })

    v.visit().then(({body, headers}) => {
      console.log(body, headers)
      t.end()
    }, (err) => {
      console.error(err.stack)
      t.fail()
      t.end()
    })
  })
})
