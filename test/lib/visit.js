const request = require('request')
const { EventEmitter } = require('events')

let uid = 0

module.exports = class Visit extends EventEmitter {
  constructor (options) {
    super()
    this.options = options
    this.uid = uid ++
  }

  visit () {
    if (this.visited) {
      return this._visit()
    }
    this.visited = true

    return this._request()
    .then(({body, headers}) => {
      this.responsed = true
      this.emit('visited')
      this.res_id = headers.id

      return {
        body,
        headers
      }
    })
  }

  _visit () {
    return new Promise((resolve, reject) => {
      if (this.responsed) {
        return resolve()
      }

      this.on('visited', () => {
        resolve()
      })
    })
    .then(() => {
      return this._request()
    })
    .then(({body, headers}) => {
      const res_id = headers.id

      return {
        body,
        headers,
        hit: res_id === this.res_id
      }
    })
  }

  _request () {
    const {
      url,
      method = 'GET',
      headers = {},
      body = ''
    } = this.options

    headers._uid = this.uid

    return new Promise((resolve, reject) => {
      request({
        method: method.toUpperCase(),
        headers,
        body,
        json: true

      }, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        resolve({
          body,
          headers: res.headers
        })
      })
    })
  }
}
