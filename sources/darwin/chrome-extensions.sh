#!/usr/bin/env kmd
exec ls '~/Library/Application Support/Google/Chrome/Default/Extensions/*/*/manifest.json'
trim
lines
  save line
  extract /([\w]+)/([\d\._]+)/manifest.json
  save identifier

  load line
  cat
  save data

  extract \"name\": \"(.*)\"
  save name

  load data
  extract \"version\": \"([\d\.]+)\"
  save version

  load data
  extract \"author\": \"(.*)\"
  save author

  remove data
  remove line
noEmpty
save chromeExtensions
