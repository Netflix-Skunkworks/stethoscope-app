#!/usr/bin/env kmd
exec dpkg-query --show --showformat='NAME=${Package} VERSION=${Version}\n'
trim
lines
  save _line
  extract NAME=([\w\d.-]+)
  save name

  load _line
  extract VERSION=([\d:.-]+)
  save version

  remove _line
noEmpty
save apps
