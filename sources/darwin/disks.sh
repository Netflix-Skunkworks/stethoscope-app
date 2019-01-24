#!/usr/bin/env kmd
exec diskutil list
split \n\n
  save _line
  extract Volume\s([\w\s]+)\s{2,}
  # defaulting to empty string allows trim to work when match isn't found
  defaultTo
  trim
  save label
  save name

  load _line
  extract (/dev/[a-z0-9]+)\s+
  save _path

  template diskutil info '{_path}'
  exec
  extract Partition UUID:\s+([A-Z0-9-]+)
  save uuid

  remove _path
  remove _line
noEmpty
save disks.volumes
