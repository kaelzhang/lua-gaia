local redis = require 'resty.redis'
local json = require 'cjson'

local ngx_log = ngx.log
local ngx_now = ngx.now
local ngx_ERR = ngx.ERR
local json_encode = json.encode
local json_decode = json.decode

local HOSTNAME = '127.0.0.1'
local PORT = 6379
local MAX_IDLE_TIME = 10000
local POOL_SIZE = 500
local TIMEOUT = 1000


local M = {}

function M.new(self, options)
  options = options or {}

  local instance = setmetatable({}, {__index = M})
  instance._timeout = options.timeout or TIMEOUT
  instance._max_idle_time = options.max_idle_time or MAX_IDLE_TIME
  instance._pool_size = options.pool_size or POOL_SIZE
  instance._hostname = options.hostname or HOSTNAME
  instance._port = options.port or PORT

  return instance
end


local function wrap_result (result)
  return result ~= ngx.null and result or nil
end


function M.timeout (self, timeout)
  self._timeout = timeout
  return self
end


function M.connect (self, hostname, port)
  self._hostname = hostname
  self._port = port
  return self
end


function M._close (self, red)
  if not red then
    return
  end

  local ok, err = red:set_keepalive(self._max_idle_time, self._pool_size)

  if not ok then
    ngx_log(ngx_ERR, 'set redis keepalive error: ', err)
  end
end


-- Connects to redis, and returns the redis instance.
function M._connect (self)
  local red, err = redis:new()
  if err then
    return nil, err
  end

  red:set_timeout(self._timeout)
  local ok, err = red:connect(self._hostname, self._port)
  if err then
    return nil, err
  end

  return red, err
end


function M.keepalive (self, max_idle_time, pool_size)
  self._redis:set_keepalive(max_idle_time, pool_size)
  return self
end


-- Set with expire time
-- expires `int=` miniseconds
function M.eset (self, key, value, expires)
  local red, err = self:_connect()
  if err then
    return nil, err
  end

  -- `ngx.now()` returns seconds with miniseconds as the decimal part
  local expires_at = expires and ngx_now() * 1000 + expires or nil
ngx.log(ngx.ERR, 'type2:' .. type(value))
  local v = json_encode({
    expires = expires_at,
    value = value
  })

  local result, err = red:set(key, v)
  if err then
    return nil, err
  end

  self._close(red)
  return wrap_result(result), err
end


-- Get with expire time and hit count
-- ```
-- local result, err, stale = red:get('foo')
-- ```
function M.eget (self, key)
  local red, err = self:_connect()
  if err then
    -- if error, always set `stale` to `false`
    return nil, err, false
  end

  local result, err = red:get(key)
  if err then
    return nil, err, false
  end

  local status, parsed = pcall(json_decode, result)

  -- If fails to parse json
  if not status then
    -- parsed will be the error message.
    return nil, parsed, false
  end

  local stale = parsed.expires and parsed.expires < ngx_now() * 1000 or false
  return parsed.value, nil, stale, parsed.expires
end


local COMMANDS = {
  'get', 'set', 'mget'
}


local function _command(self, cmd, ...)
  local red, err = self:_connect()
  if err then
    return nil, err
  end

  local fn = red[cmd]
  local result, err = fn(red, ...)
  if err then
    return nil, err
  end

  self:_close(red)
  return wrap_result(result), err
end


for i = 1, #COMMANDS do
  local cmd = COMMANDS[i]
  M[cmd] =
    function (self, ...)
      return _command(self, cmd, ...)
    end
end


return M
