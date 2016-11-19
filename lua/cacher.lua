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


function M.reload (key)
  self.

function M.get(self)
  local key = self:_hash_key()
  return self:_get(key)
end
