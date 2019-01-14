#!/usr/bin/env kmd
exec lsappinfo list
split \n\n
  save info
  extract "([^"]+)
  save name
  save displayName

  load info
  extract =\s?([\d]{4}\/[\d]{2}\/[\d]{2}\s[\d]{2}:[\d]{2}:[\d]{2})
  parseDate YYYY/MM/DD hh:mm:ss
  defaultTo never
  save lastOpenedTime
  # print lastOpenedTime
  # print name

  load info
  extract Version="([\d\.]+)"
  save version

  load info
  extract bundleID="([^"]+)
  save bundle

  remove info
save apps
