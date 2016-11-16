local redis = require 'resty.redis'
local json = require 'cjson'

local ngx_log = ngx.log
local ngx_ERR = ngx.ERR

local M = {}
local HOSTNAME = '127.0.0.1'
local PORT = 6379
local MAX_IDLE_TIME = 10000
local POOL_SIZE = 500
local TIMEOUT = 1000

local COMMANDS = {
  'append',            'auth',              'bgrewriteaof',
  'bgsave',            'bitcount',          'bitop',
  'blpop',             'brpop',
  'brpoplpush',        'client',            'config',
  'dbsize',
  'debug',             'decr',              'decrby',
  'del',               'discard',           'dump',
  'echo',
  'eval',              'exec',              'exists',
  'expire',            'expireat',          'flushall',
  'flushdb',           'get',               'getbit',
  'getrange',          'getset',            'hdel',
  'hexists',           'hget',              'hgetall',
  'hincrby',           'hincrbyfloat',      'hkeys',
  'hlen',
  'hmget',              'hmset',      'hscan',
  'hset',
  'hsetnx',            'hvals',             'incr',
  'incrby',            'incrbyfloat',       'info',
  'keys',
  'lastsave',          'lindex',            'linsert',
  'llen',              'lpop',              'lpush',
  'lpushx',            'lrange',            'lrem',
  'lset',              'ltrim',             'mget',
  'migrate',
  'monitor',           'move',              'mset',
  'msetnx',            'multi',             'object',
  'persist',           'pexpire',           'pexpireat',
  'ping',              'psetex',            'psubscribe',
  'pttl',
  'publish',      --[[ 'punsubscribe', ]]   'pubsub',
  'quit',
  'randomkey',         'rename',            'renamenx',
  'restore',
  'rpop',              'rpoplpush',         'rpush',
  'rpushx',            'sadd',              'save',
  'scan',              'scard',             'script',
  'sdiff',             'sdiffstore',
  'select',            'set',               'setbit',
  'setex',             'setnx',             'setrange',
  'shutdown',          'sinter',            'sinterstore',
  'sismember',         'slaveof',           'slowlog',
  'smembers',          'smove',             'sort',
  'spop',              'srandmember',       'srem',
  'sscan',
  'strlen',       --[[ 'subscribe',  ]]     'sunion',
  'sunionstore',       'sync',              'time',
  'ttl',
  'type',         --[[ 'unsubscribe', ]]    'unwatch',
  'watch',             'zadd',              'zcard',
  'zcount',            'zincrby',           'zinterstore',
  'zrange',            'zrangebyscore',     'zrank',
  'zrem',              'zremrangebyrank',   'zremrangebyscore',
  'zrevrange',         'zrevrangebyscore',  'zrevrank',
  'zscan',
  'zscore',            'zunionstore',       'evalsha'
}


local function is_redis_null (res)
  if type(res) == 'table' then
    for k, v in pairs(res) do
      if v ~= ngx.null then
        return false
      end
    end
    return true

  elseif res == ngx.null then
    return true

  elseif res == nil then
    return true
  end

  return false
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

  local ok, err = red:set_keepalive(self._max_idle_time, REDIS_POOL_SIZE)

  if not ok then
    ngx_log(ngx_ERR, 'set redis keepalive error : ', err)
  end
end


function M._connect (self, red)
  red:set_timeout(self._timeout)
  return red:connect(self._hostname, self._host)
end


function M._keepalive (self, red)
  red:set_keepalive(self._max_idle_time, self._pool_size)
end


function M.keepalive (self, max_idle_time, pool_size)
  self._redis:set_keepalive(max_idle_time, pool_size)
  return self
end


local function _command(self, cmd, ... )
  local red, err = redis:new()
  if not red or err then
    return nil, err
  end

  local ok, err = self:_connect(red)
  if not ok or err then
    return nil, err
  end

  local fn = red[cmd]
  local result, err = fun(red, ...)
  if not result or err then
    return nil, err
  end

  if is_redis_null(result) then
    result = nil
  end

  self:_keepalive(red)

  return result, err
end


for i = 1, #COMMANDS do
  local cmd = COMMANDS[i]
  M[cmd] =
    function (self, ...)
      return _command(self, cmd, ...)
    end
end


function M.new(self, options)
    options = options or {}

    local instance = setmetatable({}, M)
    instance._timeout = options.timeout or TIMEOUT
    instance._max_idle_time = options.max_idle_time or MAX_IDLE_TIME
    instance._pool_size = options.pool_size or POOL_SIZE
    instance._hostname = options.hostname or HOSTNAME
    instance._port = options.port or PORT

    return instance
end


return M
