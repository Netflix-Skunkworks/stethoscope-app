#!/usr/bin/env kmd
tryExec defaults read /Library/Preferences/com.apple.commerce.plist
defaultTo
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
