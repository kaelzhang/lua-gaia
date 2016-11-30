local http = require 'resty.http'
local http_new = http.new

local queued = {}

local function queued_connection (key, uri, options)
  if queued[key] then
    return nil, nil
  end

  queued[key] = true
  local httpc = http_new()
  local res, err = httpc:request_uri(uri, options)
  queued[key] = nil

  return res, err
end


local function http_connection (uri, options)
  local httpc = http_new()
  return httpc:request_uri(uri, options)
end


return {
  queued_connection = queued_connection,
  http_connection = http_connection
}
