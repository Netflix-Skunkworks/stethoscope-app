#!/usr/bin/env kmd
exec ip --oneline link show up
trim
lines
  save _line
  extract \d+:\s(\w+):\s
  save device

  load _line
  extract link/ether\s(..:..:..:..:..:..)\s
  save addr

  remove _line
noEmpty
save macAddresses
