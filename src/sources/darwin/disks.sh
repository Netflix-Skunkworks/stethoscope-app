#!/usr/bin/env kmd
exec diskutil list
split \n\n
  save _line
  extract Volume\s([\w\s]+)\s{2,}
  # defaulting to empty string prevents trim from erroring
  # when no match is found
  defaultTo
  trim
  save label
  save name

  load _line
  boolMatch Encrypted
  save encrypted

  # retrieve the disk path for the next call
  load _line
  extract (/dev/[a-z0-9]+)\s+
  save _path

  # each disk has to be run through
  # diskutil info to get the uuid
  template diskutil info '{_path}'
  tryExec
  defaultTo
  extract Partition UUID:\s+([A-Z0-9-]+)
  save uuid

  remove _path
  remove _line
noEmpty
save disks
