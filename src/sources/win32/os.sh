#!/usr/bin/env kmd
exec powershell 'Get-WmiObject win32_operatingsystem | select Caption,Version | Format-List'
trim
save line
extract Caption\s+:\s+(.*)
save system.name
save system.platform

load line
extract Version\s+:\s+([\d\.]+)
save system.version

remove line
