#!/usr/bin/env kmd
exec defaults read /Library/Preferences/SystemConfiguration/com.apple.airport.preferences
extract .*Open.*
extract Open

defaultTo Closed
save wifiConnections