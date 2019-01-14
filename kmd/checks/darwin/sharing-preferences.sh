#!/usr/bin/env kmd
exec defaults read /Library/Preferences/com.apple.alf.plist firewall
split };\n
  save line
  trim
  extract ([A-Za-z\s-]+)"?\s=
  save name

  load line
  extract state\s?=\s?([\d]+)
  save enabled

  remove line
noEmpty
save sharingPreferences
