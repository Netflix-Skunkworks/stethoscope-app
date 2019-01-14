#!/usr/bin/env kmd
exec sw_vers
save output
extract ProductVersion:\s*(\S+)
# print version
save system.version

load output
extract BuildVersion:\s*(\S+)
save system.build

load output
extract ProductName:\s*(.*)
save system.platform
remove output
