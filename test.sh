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

log kill services
node ./test/bin/kill-all.js


log delete "redis database file"
rm ./dump.rdb

log restart services
# nohup node ./test/bin/start-all.js &
node ./test/bin/start-all.js &

log start redis
nohup redis-server ./config/redis.conf &

log run "test cases"
# ava --verbose --timeout=10s || abort "test fails"
