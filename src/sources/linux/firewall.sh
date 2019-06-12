#!/usr/bin/env kmd
exec lsmod
trim
extract ip6*t_REJECT\s+\d+\s+(\d)
defaultTo false
save firewallEnabled
