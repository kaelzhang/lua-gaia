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

bash ./stop.sh

log restart services
nohup node ./test/bin/start-all.js &

log start redis
nohup redis-server ./nginx/config/redis.conf &
