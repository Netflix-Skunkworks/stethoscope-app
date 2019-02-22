#!/usr/bin/env kmd
exec lsblk -f
trim
contains crypt
save disks.encryption
