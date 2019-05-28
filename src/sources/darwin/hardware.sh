#!/usr/bin/env kmd
exec system_profiler SPHardwareDataType
save line
defaultTo
trim
extract Model Identifier: ([\w,]+)
save system.hardwareVersion

load line
extract Boot ROM Version: ([\d\.]+)
save system.firmwareVersion

load line
extract Serial Number \(system\): ([\w]+)
save system.serialNumber

load line
extract Hardware UUID: ([\w-]+)
save system.uuid

remove line
save system
