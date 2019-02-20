#!/usr/bin/env kmd

exec cat /sys/devices/virtual/dmi/id/board_vendor /sys/devices/virtual/dmi/id/board_name
save output
extract (\w+)\n
defaultTo Unavailable
save boardVendor

load output
extract .+\n(\w+)
defaultTo Unavailable
save boardName

template {boardVendor} {boardName}
save system.hardwareVersion
remove output
remove boardVendor
remove boardName
