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
  return true
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


function M.reload (self, key)
  local res = self._load(key)

  if self._when(res) then
    self._set(key, res)
  end

  return res
end


function M.get(self, on_response, force_reload)
  local key = self._hash_key()
  local res, err, stale, expires = self._get(key)

  local reloaded = false
  local hit = true

  -- 1. cache not found
  -- 2. redis connection error
  -- 3. force to reload
  if not res or err or force_reload then
    reloaded = true
    hit = false
    stale = false
    res = self:reload(key)
  end

  on_response(res, hit, stale, expires)

  -- If stale, then we need reload cache
  -- TODO: concurrency
  if stale then
    self:reload(key)
  end
end

return M
