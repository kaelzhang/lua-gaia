const request = require('request')
const { EventEmitter } = require('events')
const uuid = require('uuid')
const clone = require('clone')

const BACKEND_HOST = 'http://127.0.0.1:8080'

module.exports = class Visit extends EventEmitter {
  constructor (options) {
    super()
    this.options = options
  }

  visit (options) {
    if (!this.visited) {
      return this._visit(options)
    }

    if (this.ready) {
      return this._request(options)
    }

    return new Promise((resolve) => {
      this.on('ready', () => {
        resolve()
      })
    })
    .then(() => {
      return this._request()
    })
  }

  _visit (options) {
    return this._request(options)
    .then((res) => {
      this.ready = true
      this.emit('ready')
      return res
    })
  }

  _request ({
    log = false
  } = {}) {
    this.visited = true

    const {
      url,
      method = 'GET',
      headers = {},
      body = ''
    } = this.options

    const id = uuid.v4()
    const h = clone(headers)
    h.id = id
    h['User-Agent'] = 'Gaia-Test-Agent'

    if (log) {
      h['Turn-On-Test-Log'] = '1'
    }

    return new Promise((resolve, reject) => {
      const options = {
        uri: url,
        method: method.toUpperCase(),
        headers: h,
        body
      }

      request(options, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        body = JSON.parse(body)

        const ret = {
          body,
          headers: res.headers,
          stale: res.headers.id !== id
        }
        resolve(ret)
      })
    })
  }
}
