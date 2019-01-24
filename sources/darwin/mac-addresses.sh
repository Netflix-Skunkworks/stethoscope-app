#!/usr/bin/env kmd
exec networksetup -listallhardwareports
trim
split \n\n
  save line
  extract Device:\s+\w+[^:]+:\s+([0-9a-f:]+)
  save addr

  load line
  extract Device:\s+(\w+)
  save device

  remove line

  echo null
  save type
  save physicalAdapter
  save lastChange
noEmpty
save macAddresses
