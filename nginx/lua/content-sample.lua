local cache = require 'cache'
local headers = ngx.req.get_headers()

local STR_GAIA_STATUS = 'Gaia-Status'
local STR_GAIA_EXPIRES_AT = 'Gaia-Expires-At'

-----------------------------------------------------------
-- If body needed, use `lua_need_request_body on`

-- Explicitly tell the cache to include body.
-- If the comming request (most probably for purging request) is not from
-- nginx location with `lua_need_request_body on`, we need to do this.
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
    header[STR_GAIA_EXPIRES_AT] =
      os.date('%Y-%m-%d %H:%M:%S', expires_at / 1000)
  end

  ngx.say(res.body)
  ngx.eof()
end

cache:get(on_response, headers['gaia-purge'])
