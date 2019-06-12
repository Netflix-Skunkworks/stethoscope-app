#!/usr/bin/env kmd
exec cat /etc/os-release
save output
extract NAME="(.*)"
save system.platform

load output
extract VERSION_ID="*([\d\.]+)"*
save system.version
remove output

exec uname -r
save system.build
