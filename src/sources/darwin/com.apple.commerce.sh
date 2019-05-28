#!/usr/bin/env kmd
exec defaults read /Library/Preferences/com.apple.commerce.plist
save line
extract AutoUpdateRestartRequired\s+=\s+([\d]+);
defaultTo 1
save updates.restartRequired

load line
extract AutoUpdate\s+=\s+([\d]+);
defaultTo 1
save updates.autoUpdate

remove line
save updates
