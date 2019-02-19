#!/usr/bin/env kmd
exec lsmod
extract ip6?t_REJECT\s+\d+\s+(\d)
save firewallEnabled
