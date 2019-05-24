#!/usr/bin/env kmd
exec wmic csproduct get vendor, version
trim
save out
extract \n([\w]+)\s+
save system.hardwareVendor

load out
extract \n[\w]+\s+([\w\s]+)
save system.hardwareVersion

remove out
