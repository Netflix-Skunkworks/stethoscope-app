#/usr/bin/env kmd
exec powercfg /getactivescheme
extract GUID: ([a-zA-Z0-9-]+)
save _activePowerGUID

template powercfg /query '{_activePowerGUID}' 7516b95f-f776-4464-8c53-06167f40cc99 3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e
exec
save _output
extract AC.*0x([0-9a-fA-F]{8,8})
parseInt 16
defaultTo 0
save chargingTimeout

load _output
extract DC.*0x([0-9a-fA-F]{8,8})
parseInt 16
defaultTo 0
save batteryTimeout

remove _output
remove _activePowerGUID
