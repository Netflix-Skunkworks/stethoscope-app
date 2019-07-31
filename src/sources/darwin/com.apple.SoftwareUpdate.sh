#!/usr/bin/env kmd
tryExec defaults read /Library/Preferences/com.apple.SoftwareUpdate.plist
defaultTo
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

load output
extract AutomaticallyInstallMacOSUpdates\s+=\s+([\d]+);
defaultTo 1
save updates.automaticallyInstallMacOSUpdates

remove output
save updates
