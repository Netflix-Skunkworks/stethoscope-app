#!/usr/bin/env kmd
exec lsblk --fs --pairs
trim
lines
  save _line
  extract NAME="([\w-]+)"\s
  save name

  load _line
  extract UUID="([\w-]+)"\s
  save uuid

  load _line
  extract LABEL="([\w\s\d-]*)"\s
  save label

  load _line
  extract FSTYPE="([\w-]+)"\s
  save type

  remove _line
noEmpty
save disks.volumes
