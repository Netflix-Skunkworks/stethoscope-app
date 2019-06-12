#!/usr/bin/env kmd
exec gsettings list-recursively org.gnome.desktop.screensaver
trim
save output

extract lock-enabled (.*)
save screen.lockEnabled

load output
extract logout-delay uint\d+ (\d+)
save screen.logoutDelay

load output
extract lock-delay uint\d+ (\d+)
save screen.lockDelay

load output
extract idle-activation-enabled (.*)
save screen.idleActivationEnabled

load output
extract ubuntu-lock-on-suspend (.*)
defaultTo UNSUPPORTED
save screen.lockOnSuspend

remove output
