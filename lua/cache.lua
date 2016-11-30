-- Store the cache instance in a standalone lua file to cache it.

-- We use a nginx rewrite directive with break
-- to proxy pass the request to the backend server.
local BACKEND_PREFIX = '/_'
local BACKEND_SERVER = 'http://127.0.0.1:8081'

local cacher = require 'cacher'
local redis = require 'redis'
local json = require 'cjson'
local json_encode = json.encode
local json_decode = json.decode

local queued_connection = require 'queued-http'

local red = redis:new()

local function hash_key ()
  local key = ngx.var.request_method .. ':' .. ngx.var.uri
  local headers = ngx.req.get_headers()

  local custom_field = headers['gaia-custom-field']
  if custom_field then
    key = key .. ',custom=' .. custom_field
  end

  local args = ngx.req.get_uri_args()
  key = key .. ',args=' .. json_encode(args)

  if headers['gaia-enable-body'] then
    key = key .. ',body=' .. ngx.req.get_body_data()
  end

  return key
end


local function get (key)
  return red:eget(key)
end


local function set (key, value, expires)
  return red:eset(key, value, expires)
end


local function remove_key (t, keys)
  for _, key in pairs(keys) do
    t[key] = nil
  end

  local obj = {}
  for k, v in pairs(t) do
    if v then
      obj[k] = v
    end
  end

  return obj
end


local REQUEST_METHOD_MAP = {
  GET = ngx.HTTP_GET,
  POST = ngx.HTTP_POST,
  DELETE = ngx.HTTP_DELETE,
  _ = ngx.HTTP_GET
}

local function load (key, options)
  if options.sub_request then
    local method = ngx.var.request_method
    local capture_options = {
      args = ngx.req.get_uri_args(),
      method = REQUEST_METHOD_MAP[method]
        or REQUEST_METHOD_MAP._
    }

    if method ~= 'GET' then
      capture_options.body = ngx.req.get_body_data() or ''
    end

    local res = ngx.location.capture(
      BACKEND_PREFIX .. ngx.var.uri,
      capture_options
    )

    return {
      status = res.status,
      -- header -> headers
      headers = res.header,
      body = res.body
    }
  end

  options.headers = remove_key(options.headers, {
    'connection',
    'content-length'
  })

  local res, err = queued_connection(
    key,
    BACKEND_SERVER .. options.uri,
    options,
    options.single_through
  )

  return not err and res and {
    status = res.status,
    headers = res.headers,
    body = res.body
  } or nil
end


local function when (res)
  if not res then
    return false
  end

  local ok, parsed = pcall(json_decode, res.body)
  return res.status == 200 and (
    -- is not json
    not ok
    -- json with code: 200
    or ok and parsed.code == 200
  )
end


local function expires ()
  local expire_header = ngx.req.get_headers()['gaia-expires']
  return expire_header and tonumber(expire_header) or nil
end


local cache = cacher
:new()
:hash_key(hash_key)
:getter(get)
:setter(set)
:loader(load)
:when(when)
:expires(expires)

return cache
