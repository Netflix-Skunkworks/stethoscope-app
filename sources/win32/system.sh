#!/usr/bin/env kmd
exec powershell 'Get-WmiObject win32_operatingsystem | select Caption,Version,SerialNumber | Format-List'
trim
save line
extract Caption\s+:\s+(.*)
save system.name
save system.platform

load line
extract Version\s+:\s+([\d\.]+)
save system.version

load line
extract SerialNumber\s+:\s+([\d\-A-Z]+)
save system.serialNumber
save system.uuid

remove line
