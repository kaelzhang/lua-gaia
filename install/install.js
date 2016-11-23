require('shelljs/global')
const path = require('path')

function export_env (name, value) {
  process.env['GAIA_' + name.toUpperCase()] = value
}

// const dir_sync = require('tmp').dirSync()
// export_env('tmp', dir_sync.name)

const platform = process.platform === 'darwin'
  ? 'macosx'
  : 'linux'
export_env('lua_install_platform', platform)

const PROJECT_ROOT = path.join(__dirname, '..')
export_env('lua_cpath', path.join(PROJECT_ROOT, 'luac'))
export_env('lua_path', path.join(PROJECT_ROOT, 'lua'))

process.env.LUALIB = '~/lib/lua-5.3.3/src'

exec(`bash ${PROJECT_ROOT}/install/install.sh`)
