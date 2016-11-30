const test = require('ava')
const Visit = require('./lib/visit')
const sleep = require('sleep-promise')
const url = require('url')

const {
  read,
  file
} = require('./lib/util')

test.cb('environment: should has no errors', t => {
  read(file('nohup.out'))
  .then((content) => {
    console.log(`nohup.out:\n${content}\n`)
    t.is(/error/i.test(content), false)
    t.end()
  })
})

const BACKEND_HOST = 'http://127.0.0.1:8080'
const SLEEP_TOLERANCE = 50

const CASES = [
  {
    d: 'simple request',
    u: '/test-simple',
    cache: true,
    expires: false
  },

  {
    d: 'expires',
    u: '/test-expires-1s',
    h: {
      'Gaia-Expires': '1000'
    },
    expires: 1000,
    cache: true
  },

  {
    d: 'if code is not 200, no cache',
    u: '/test-cache-code',
    cache: false,
    h: {
      code: 500
    }
  },

  {
    d: 'if http status is not 200, no cache',
    u: '/test-cache-status',
    cache: false,
    h: {
      status: 500
    }
  },

  {
    d: 'cache purge',
    u: '/test-purge',
    cache: false,
    h: {
      'Gaia-Purge': '1'
    }
  },

  {
    d: 'concurrency: shoule get the same response when stale',
    u: '/test-concurrency',
    cache: true,
    expires: 1000,
    concurrency: true,
    h: {
      'Gaia-Expires': '1000'
    }
  }
]

CASES.forEach(({d, u, cache, expires, only, h, method, b, concurrency}) => {
  const _test = only
    ? test.cb.only
    : test.cb

  u = BACKEND_HOST + u

  const parsed = url.parse(u, true)
  const pathname = parsed.pathname
  const query = parsed.query

  _test(`${d}: ${u}, cache:${cache}, expires:${expires}`, t => {
    let ended = false
    function end () {
      if (ended) {
        return
      }
      ended = true
      t.end()
    }

    const v = new Visit({
      url: u,
      method,
      headers: h,
      body: b
    })

    function basic_test (name, body, headers) {
      t.is(body.pathname, pathname, `${name}: pathname`)
      t.deepEqual(body.query, query, `${name}: query`)
      t.deepEqual(body.body, b || {}, `${name}: body`)
      t.is(headers['server'], 'Gaia/1.0.0', `${name}: header server`)
      t.is(body.headers['user-agent'], 'Gaia-Test-Agent', `${name}: user agent`)
    }

    function visit_again (name = 'again') {
      return v.visit()
      .then(({body, headers, stale}) => {
        basic_test(name, body, headers, t)
        t.is(headers['gaia-status'], cache ? 'HIT' : 'MISS', `${name}: cache status`)
      })
    }

    function visit_expire (after) {
      if (concurrency) {
        let id
        return sleep(after)
        .then(() => {
          const tasks = []
          const max = 10
          let count = 0

          while (count ++ < max) {
            tasks.push(v.visit())
          }

          return Promise.all(tasks)
        })
        .then((reses) => {
          return reses.every((res) => {
            t.is(
              res.headers['gaia-status'],
              'STALE',
              'headers should be stale'
            )

            if (!id) {
              id = res.body.headers.id
              return true
            }

            return res.body.headers.id === id
          })
        })
        .then((result) => {
          if (!result) {
            return Promise.reject('no single cache through.')
          }

          return Promise.resolve()
        })
      }

      return sleep(after)
      .then(() => {
        return v.visit()
      })
      .then(({body, headers, stale}) => {
        basic_test('expire', body, headers, t)

        t.is(stale, true, 'response should be stale if expires')
        t.is(headers['gaia-status'], 'STALE', 'headers should be stale')

        return sleep(300)
        .then(() => {
          return visit_again('after reload')
        })
      })
    }

    v.visit().then(({body, headers, stale}) => {
      basic_test('first', body, headers)
      t.is(headers['gaia-status'], 'MISS')

      const tasks = [
        visit_again()
      ]

      if (cache && expires) {
        tasks.push(
          visit_expire(expires)
        )
      }

      Promise.all(tasks)
      .then(() => {
        end()
      })
    })
    .catch((err) => {
      console.error(err.stack || err)
      t.fail()
      end()
    })
  })
})
