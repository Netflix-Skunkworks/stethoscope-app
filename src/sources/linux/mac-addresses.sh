#!/usr/bin/env kmd
exec ifconfig
trim
split \n\n
  save _line
  extract (\w+):\s
  save device

  load _line
  extract .*(..:..:..:..:..:..)
  save addr

  remove _line
noEmpty
save macAddresses
