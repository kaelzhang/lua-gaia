const test = require('ava')
const Visit = require('./lib/visit')
const sleep = require('sleep-promise')
const url = require('url')

const {
  read,
  file
} = require('./lib/util')

test.cb('environment: should has no errors', t => {
  read(file('../nohup.out'))
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
    cache: true
  },

  {
    d: 'post request: should not be messed up with get request',
    delay: 200,
    u: '/test-simple',
    cache: true,
    method: 'POST'
  },

  {
    d: 'post request: body',
    u: '/test-post-body',
    h: {
      'Content-Type': 'application/json'
    },
    cache: true,
    method: 'POST',
    b: '{"foo":1}'
  },

  {
    d: 'custom field to distinguish other requests',
    delay: 200,
    u: '/test-simple',
    cache: true,
    h: {
      'Gaia-Custom-Field': '1'
    }
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


function json_parse (string) {
  try {
    return JSON.parse(string)
  } catch (e) {
    return {}
  }
}


CASES.forEach(({d, u, delay, cache, expires, only, h, method = 'GET', b, concurrency}) => {
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
      t.deepEqual(body.body, json_parse(b), `${name}: body`)
      t.is(headers['server'], 'Gaia/1.0.0', `${name}: header server`)
      t.is(body.method.toUpperCase(), method.toUpperCase())
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
            tasks.push(v.visit({
              log: true
            }))
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

          return sleep(50)
          .then(x => read(file('logs/server.log')))
          .then((content) => {
            const logs_count = content.split(/\r|\n/)
            .map(x => x.trim())
            .filter(Boolean)

            t.is(logs_count.length, 1, 'concurrency: many connections occur.')
          })
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

    function start () {
      if (delay) {
        return sleep(delay)
        .then(() => {
          return v.visit()
        })
      }

      return v.visit()
    }

    start()
    .then(({body, headers, stale}) => {
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


test.cb('should instantly response even if stale', t => {
  const pathname = '/slow-response'
  const method = 'GET'
  const query = {}

  const v = new Visit({
    url: `${BACKEND_HOST}${pathname}`,
    method,
    headers: {
      'Gaia-Expires': '10',
      'Slow-Response': '1'
    }
  })

  function basic_test (body, headers, name = 'slow-response-stale') {
    t.is(body.pathname, pathname, `${name}: pathname`)
    t.deepEqual(body.query, query, `${name}: query`)
    t.is(headers['server'], 'Gaia/1.0.0', `${name}: header server`)
    t.is(body.method.toUpperCase(), method.toUpperCase())
    t.is(body.headers['user-agent'], 'Gaia-Test-Agent', `${name}: user agent`)
  }

  v.visit()
  .then(({body, headers, stale}) => {
    basic_test(body, headers)
    t.is(stale, false)

    return sleep(50)
    .then(x => v.visit())
    .then(({body, headers, stale}) => {
      t.is(stale, true)
      t.is(body.spent < 2000, true)
    })
  })
  .then(() => {
    t.end()
  })
  .catch((err) => {
    t.fail(err.stack)
    t.end()
  })
})


test.after('there should be no error logs', t => {
  function contains_then_fail () {

  }
})
