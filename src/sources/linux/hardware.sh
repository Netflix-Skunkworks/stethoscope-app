#!/usr/bin/env kmd

exec cat /sys/devices/virtual/dmi/id/board_vendor /sys/devices/virtual/dmi/id/board_name /sys/devices/virtual/dmi/id/product_name
save output
extract (.+)\n
defaultTo Unavailable
save boardVendor

load output
extract .+\n(.+)
defaultTo Unavailable
save boardName

load output
extract .+\n.+\n(.+)
defaultTo Unavailable
save productName

template {boardVendor} | {productName} | {boardName}
save system.hardwareVersion
remove output
remove boardVendor
remove boardName
