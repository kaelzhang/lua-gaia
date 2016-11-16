local http = require 'resty.http'
local httpc = http.new()

ngx.say('hello')
ngx.eof()

ngx.log(ngx.ERR, 'fetch')

local res, err = httpc:request_uri(
  'https://github.com/openresty/lua-nginx-module#ngxexit', {
    method = 'GET'
  }
)

if not res then
  ngx.log(ngx.ERR, 'error fetch github')
  return
end

ngx.log(ngx.ERR, res.body)
