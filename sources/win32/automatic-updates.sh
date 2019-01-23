#/usr/bin/env kmd
exec sc query wuauserv
trim
save line
extract STATE[\s]+\:[\s\d]+([A-Z_]+)
save automaticUpdates
remove line
