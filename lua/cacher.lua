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


local M = {
  _hash_key = default_hash_key,
  _set = default_set,
  _get = default_get,
  _load = default_load
}


function M.new (self, set, get)
  return setmetatable({}, M)
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


function M.loader (self, fn)
  self._load = fn
  return self
end


function load (self, fn)
  self._load = fn
  return self
end


function M.reload (self, key)
  local res = self:_load(key)
  self:_set(age )
  self:_set(key, res)
  return res
end


function M.key (self)
  return self:_hash_key()
end


function M.get(self, key, on_response)
  local res, err, stale = self:_get(key)
  local reloaded = false

  if err then
    reloaded = true
    res = self:reload(key)
  end

  on_response(res)

  if reloaded then
    return
  end

  if stale then
    self:reload(key)
  end
end
