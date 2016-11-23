#!/bin/bash

# GAIA_TMP=${}
#

#
# Exit with the given <msg ...>
abort() {
  printf "\n\x1B[31mError: $@\x1B[0m\n\n"
  exit 1
}

log() {
  local label=$1
  shift
  printf "\x1B[36m>>> %s\x1B[0m :" $label
  printf " \x1B[90m$@\x1B[0m\n"
}


PREFIX=/usr/local
DOWNLOAD_PREFIX=/usr/local/installer
LUA_INCLUDE_DIR=${PREFIX}/include

CJSON_SOURCE=$DOWNLOAD_PREFIX/installer
GAIA_LUA_INSTALL_PLATFORM=${GAIA_LUA_INSTALL_PLATFORM-macosx}
# GAIA_LUA_PATH
# GAIA_LUA_CPATH


mkdir $DOWNLOAD_PREFIX || echo "${DOWNLOAD_PREFIX} exists."


clean_installer () {
  log clean "old files"
  rm -rf $DOWNLOAD_PREFIX/lua-5.5.3
  rm $LUA_INCLUDE_DIR/lua
  rm /usr/local/lib/liblua.dylib

  rm -rf $DOWNLOAD_PREFIX/lua-cjson
}


linux_install_lua () {
  log download "lua source codes"
  cd $DOWNLOAD_PREFIX
  curl -O http://www.lua.org/ftp/lua-5.3.3.tar.gz
  tar zxf lua-5.3.3.tar.gz
  cd lua-5.3.3

  log compile lua
  # Build lua bin
  make $GAIA_LUA_INSTALL_PLATFORM test

  # link lua include
  ln -sf $DOWNLOAD_PREFIX/lua-5.3.3/src $LUA_INCLUDE_DIR/lua

  echo 'liblua.dylib: $(CORE_O) $(LIB_O)' >> src/makefile
  echo -e '\t$(CC) -dynamiclib -o $@ $^ $(LIBS) -arch i386 -arch x86_64 -compatibility_version 5.3.3 -current_version 5.3.3 -install_name @rpath/$@' >> src/makefile

  log compile liblua.dylib
  make -C src liblua.dylib

  ln -sf $DOWNLOAD_PREFIX/lua-5.3.3/src/liblua.dylib /usr/local/lib/liblua.dylib
}


mac_install_lua () {
  which lua || abort 'You should `brew install lua` first.'
}


# install_luajit () {

# }


linux_install_cjson () {
  log download cjson
  git clone https://github.com/kaelzhang/lua-cjson.git $DOWNLOAD_PREFIX/lua-cjson
  cd $DOWNLOAD_PREFIX/lua-cjson

  log compile cjson
  make
  cp $DOWNLOAD_PREFIX/lua-cjson/cjson.so $GAIA_LUA_CPATH
}


mac_install_cjson () {

}


clean_installer
install_lua
# install_luajit
install_cjson
