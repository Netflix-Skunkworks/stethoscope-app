#!/usr/bin/env kmd
exec wmic csproduct get uuid, vendor, version
trim
save out

extract \n([\w\d-]+)
save system.uuid

load out
extract \n[\w\d-]+\s+([\w+\s]+)\s+[\d.]+
save system.hardwareVendor

load out
extract \n[\w\d-]+\s+[\w+\s]+\s+([\d.]+)
save system.hardwareVersion

remove out

exec powershell 'Get-WmiObject win32_operatingsystem | select SerialNumber | Format-List'
extract SerialNumber\s+:\s+([\d\-A-Z]+)
save system.serialNumber
