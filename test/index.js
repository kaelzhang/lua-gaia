const test = require('ava')
const Visit = require('./lib/visit')
const sleep = require('sleep-promise')

const BACKEND_HOST = 'http://127.0.0.1:8080'
const SLEEP_TOLERANCE = 50

const CASES = [
  {
    d: 'simple request',
    url: '/',
    cache: true,
    expires: false
  },

  {
    d: 'expires',
    url: '/expires-1s',
    expires: 1000,
    cache: true
  }
]


CASES.forEach(({url, cache, expires, only, headers, method, body}) => {
  const _test = only
    ? test.cb.only
    : test.cb

  url = BACKEND_HOST + url

  _test(`${url}, cache:${cache}, expires:${expires}`, t => {
    let ended = false
    function end () {
      if (ended) {
        return
      }
      ended = true
      t.end()
    }

    const v = new Visit({
      url,
      method,
      headers,
      body
    })

    v.visit().then(({body, headers, stale}) => {
      console.log(headers)
      t.is(headers['gaia-status'], 'MISS')

      // if (expires) {
      //   return sleep(expires + SLEEP_TOLERANCE)
      //   .then(() => {

      //   })
      // }
      end()

    })
    .catch((err) => {
      console.error(err.stack)
      t.fail()
      end()
    })
  })
})
