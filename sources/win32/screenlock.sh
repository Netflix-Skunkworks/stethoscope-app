#/usr/bin/env kmd
exec powercfg /getactivescheme
extract Power Scheme GUID: ([a-zA-Z0-9-]+)
save _activePowerGUID

template powercfg /query '{_activePowerGUID}' 7516b95f-f776-4464-8c53-06167f40cc99 3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e
exec
trim
save _output
extract Current AC Power Setting Index: 0x([\d]+)
parseInt 16
save chargingTimeout

load _output
extract Current DC Power Setting Index: 0x([\d]+)
parseInt 16
save batteryTimeout

remove _output
remove _activePowerGUID
