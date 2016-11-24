const test = require('ava')
const Visit = require('./lib/visit')
const server = require('./bin')

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


CASES.forEach(({req, cache, expires, only, headers, method, body}) => {
  const _test = only
    ? test.cb.only
    : test.cb

  _test(`${req}, cache:${cache}, expires:${expires}`, t => {
    // const v = new Visit({
    //   url,
    //   method,
    //   headers,
    //   body
    // })

    // v.visit().then(({body, headers}) => {

    // }, (err) => {
    //   t.fail()
    //   t.end()
    // })

    t.end()
  })
})
