#!/usr/bin/env kmd
# exec sc query mpssvc
# trim
# save line
# extract STATE[\s]+\:[\s\d]+([A-Z_]+)
# save firewallStatus
# remove line

exec netsh advfirewall show allprofile
trim
split \r\n\r\n
  save _line
  extract (Domain|Private|Public) Profile Settings
  save type

  load _line
  extract State[\s\t]+(ON|OFF)
  save status

  remove _line
noEmpty
save firewalls
