-- Cacher

-- By default, use uri as the hash key
local function default_hash_key ()
  return ngx.var.uri
end


local function default_set ()
  error('set must be specified')
end


local function default_get ()
  error('get must be specified')
end


local function default_load ()
  error('load must be specified')
end


-- by default, always cache
local function when (res)
  return res
end


local M = {
  _hash_key = default_hash_key,
  _set = default_set,
  _get = default_get,
  _load = default_load,
  _when = when
}


function M.new (self)
  return setmetatable({}, {__index = M})
end


function M.hash_key (self, fn)
  self._hash_key = fn
  return self
end


function M.setter (self, fn)
  self._set = fn
  return self
end


function M.getter (self, fn)
  self._get = fn
  return self
end


function M.when(self, fn)
  self._when = fn
  return self
end


function M.loader (self, fn)
  self._load = fn
  return self
end


function M.expires (self, fn)
  self._get_expires = fn
  return self
end


function M.reload (self, key, options)
  local res = self._load(options)

  if self._when(res) then
    self._set(key, res, options.expires)
  end

  return res
end


function M.get(self, on_response, force_reload)
  local key = self._hash_key()
  local res, err, stale, expires_at = self._get(key)

  local reloaded = false
  local hit = true

  -- 1. cache not found
  -- 2. redis connection error
  -- 3. force to reload
  if not res or err or force_reload then
    reloaded = true
    hit = false
    stale = false
    res = self:reload(key, {
      expires = self._get_expires(),
      sub_request = true
    })
  end

  -- lua has block scope
  local expires = nil
  local uri = nil
  local query = nil
  local headers = nil
  local body = nil
  local method = nil

  -- Prefetch parameters before connection closed.
  if stale then
    expires = self._get_expires()
    uri = ngx.var.uri
    headers = ngx.req.get_headers() or {}
    query = ngx.req.get_uri_args() or {}
    body = ngx.req.get_body_data() or ''
    method = ngx.var.request_method or 'GET'
  end

  on_response(res, hit, stale, expires_at)

  -- If stale, then we need reload cache
  -- TODO: concurrency
  if stale then
    self:reload(key, {
      expires = expires,
      uri = uri,
      headers = headers,
      args = args,
      body = body,
      method = method
    })
  end
end

return M
