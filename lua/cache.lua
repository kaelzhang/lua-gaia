-- Store the cache instance in a standalone lua file to cache it.

local BACKEND_PREFIX = '/_'

local cacher = require 'cacher'
local redis = require 'redis'
local http = require 'resty.http'
local json = require 'cjson'
local json_encode = json.encode

local red = redis:new()

local function hash_key ()
  local key = ngx.var.uri
  local headers = ngx.req.get_headers()

  local custom_field = headers['gaia-custom-field']
  if custom_field then
    key = key .. ',custom=' .. custom_field
  end

  local args = ngx.req.get_uri_args()
  key = key .. ',args=' .. json_encode(args)

  if headers['gaia-enable-body'] then
    ngx.req.read_body()
    key = key .. ',body=' .. ngx.req.get_body_data()
  end

  return key
end


local function get (key)
  return red:eget(key)
end


local function set (key, value)
  local expire_header = ngx.req.get_headers()['gaia-expires']
  local expires = expire_header and tonumber(expire_header) or nil

  return red:eset(key, value, expires)
end


local function load (key)
  return ngx.location.capture(BACKEND_PREFIX .. ngx.var.uri, {
    args = ngx.req.get_uri_args()
  })
end


local function when (res)
  local ok, parsed = pcall(json_decode, res.body)
  return not ok or ok and parsed.code == 200
end


local cache = cacher
:new()
:hash_key(hash_key)
:getter(get)
:setter(set)
:loader(load)
:when(when)

return cache
