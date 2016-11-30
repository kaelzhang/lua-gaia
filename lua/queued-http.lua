local http = require 'resty.http'
local http_new = http.new
local lrucache = require 'resty.lrucache'

-- This functionality needs `lua_code_cache on;` to work.
local queue = lrucache.new(2000)

local function queued_connection (key, uri, options, use_queue)
  if not use_queue then
    return http_connection(uri, options)
  end

  local queued = queue:get(key)

  if queued then
    return nil, nil
  end

  queue:set(key, true)
  local httpc = http_new()
  local res, err = httpc:request_uri(uri, options)
  queue:delete(key)

  return res, err
end


local function http_connection (uri, options)
  local httpc = http_new()
  return httpc:request_uri(uri, options)
end


return queued_connection
