#!/bin/bash

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

# give redis enough time to exit
sleep 1

log remove "redis database file"
rm ./dump.rdb

log remove "nginx logs"
rm ./nginx/logs/access.log
rm ./nginx/logs/error.log
rm ./nginx/logs/server.log
rm ./nginx/logs/server-access.log

log remove "nohup.out"
rm ./nohup.out
