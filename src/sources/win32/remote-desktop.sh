#!/usr/bin/env kmd
exec reg query 'HKLM\\System\\CurrentControlSet\\Control\\Terminal Server'
save output
trim
extract fDenyTSConnections\s+[A-Z_]+\s+0x([\d]+)
save sharingPreferences.remoteDesktopDisabled

load output
extract AllowRemoteRPC\s+[A-Z_]+\s+0x([\d]+)
save sharingPreferences.remoteRPCAllowed

remove output
