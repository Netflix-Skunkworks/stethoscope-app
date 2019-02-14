#!/usr/bin/env kmd
exec wmic csproduct get uuid
trim
extract ([\w\d-]+-[\w\d]+)
save system.uuid
