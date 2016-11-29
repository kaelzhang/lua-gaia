local cache = require 'cache'
local headers = ngx.req.get_headers()

local STR_GAIA_STATUS = 'Gaia-Status'
local STR_GAIA_EXPIRES_AT = 'Gaia-Expires-At'

-----------------------------------------------------------

-- Explicitly tell the cache to include body
if headers['gaia-include-body'] then
  ngx.req.read_body()
end


local function on_response (res, hit, stale, expires_at)
  local header = ngx.header

  for k, v in pairs(res.headers) do
    header[k] = v
  end

  header[STR_GAIA_STATUS] =
    stale and 'STALE' or
    hit and 'HIT' or 'MISS'

  if expires_at then
    header[STR_GAIA_EXPIRES_AT] = tostring(expires_at)
  end

  ngx.say(res.body)
  ngx.eof()
end


cache:get(on_response, headers['gaia-purge'])
