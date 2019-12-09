import path from 'path'
import os from 'os'
import fs from 'fs'
import log from './logger'

let basePath = path.join(
  os.homedir(),
  '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi'
)

if (os.platform() === 'win32') {
  basePath = path.resolve('%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\fmkadmapgofadopljbjfkapdkoienihi')
}

export default function loadReactDevTools (BrowserWindow) {
  fs.readdir(basePath, function (err, items) {
    if (!err) {
      const [version] = items
      if (version) {
        BrowserWindow.addDevToolsExtension(`${basePath}${path.sep}${String(version).trim()}`)
        log.info('Added React Dev Tools extension')
      } else {
        log.info('ReactDevTools extension not found in Chrome extensions dir')
      }
    } else {
      log.error('Unable to add react devtools', err)
    }
  })
}
