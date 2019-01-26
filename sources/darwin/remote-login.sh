#!/usr/bin/env kmd
exec netstat -anv
trim
extract \*.(22|23)
save remoteLogin
