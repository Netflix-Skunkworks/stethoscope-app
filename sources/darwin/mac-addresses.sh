#!/usr/bin/env kmd
exec networksetup -listallhardwareports
trim
split \n\n
  save _line
  extract Device:\s+\w+[^:]+:\s+([0-9a-f:]+)
  save addr

  load _line
  extract Device:\s+(\w+)
  save device

  remove _line
noEmpty
save macAddresses
