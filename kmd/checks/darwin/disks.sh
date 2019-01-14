#!/usr/bin/env kmd
exec diskutil list
split \n\n
  save line
  extract Volume\s([\w\s]+)\s{2,}
  # defaulting to empty string allows trim to work when match isn't found
  defaultTo
  trim
  save label

  remove line
noEmpty
save disks.volumes
