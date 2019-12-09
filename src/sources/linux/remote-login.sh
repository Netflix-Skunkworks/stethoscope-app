#!/usr/bin/env kmd
exec ss -ltn
trim
extract :(2[23])\s
defaultTo false
save remoteLogin
