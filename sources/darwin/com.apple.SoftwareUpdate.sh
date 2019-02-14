#!/usr/bin/env kmd
exec defaults read /Library/Preferences/com.apple.SoftwareUpdate.plist
save output
extract CriticalUpdateInstall\s+=\s+([\d]+);
defaultTo 1
save updates.criticalUpdateInstall

load output
extract AutomaticCheckEnabled\s+=\s+([\d]+);
defaultTo 1
save updates.automaticCheckEnabled

load output
extract ConfigDataInstall\s+=\s+([\d]+);
defaultTo 1
save updates.configDataInstall

load output
extract AutomaticDownload\s+=\s+([\d]+);
defaultTo 1
save updates.automaticDownload

remove output
save updates
