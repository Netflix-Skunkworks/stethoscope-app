const glob = require('glob')
const plist = require('plist-native')
const fs = require('fs')
const moment = require('moment')
const cache = require('memory-cache')
const execa = require('execa')
const { exec } = require('child_process')

const ONE_DAY = 86400000

// reads all Info.plist files from installed apps
function apps() {
  return new Promise((resolve, reject) => {
    glob('/Applications/*.app', async (err, files) => {
      if (err) return reject(err)

      const fileNames = files.map(n => `${n}/Contents/Info.plist`)
      const fileContents = fileNames.map(file => {
        try {
          return plist.parse(fs.readFileSync(file))
        } catch (e) {
          return false
        }
      })

      const out = parse(fileContents)
      const info = await lsappinfo()

      resolve(out.map(app => {
        if (app.name in info) {
          app.lastOpen = +info[app.name]
        }
        return app
      }))
    })
  })
}

function lsappinfo() {
  if (cache.get('lsappinfo')) {
    return parseAppInfo(cache.get('lsappinfo'))
  }

  return new Promise((resolve, reject) => {
    exec('lsappinfo list', (error, stdout, stderr) => {
      if (error) { reject(error) }
      else {
        cache.put('lsappinfo', stdout, ONE_DAY)
        resolve(parseAppInfo(stdout))
      }
    })
  })
}

async function asynclsappinfo() {
  if (cache.get('lsappinfo')) {
    return parseAppInfo(cache.get('lsappinfo'))
  }

  try {
    const { stdout } = execa.shell('lsappinfo list')
    cache.set('lsappinfo', stdout, ONE_DAY)
    resolve(parseAppInfo(stdout))
  } catch (e) {
    throw e
  }
}

function parseAppInfo(lsappinfoData) {
  const entries = lsappinfoData.split(/\d+\)/g).map(a => a.trim())

  return entries.reduce((p, entry) => {
    let [app, ...rest] = entry.split('\n')
    let lastOpen = null;
    const match = app.match(/\"(.*)\"/)

    if (match) {
      app = match[1]
    }

    rest.forEach(line => {
      if (line.includes('checkin time')) {
        let match = line.match(/=\s?([\d]{4}\/[\d]{2}\/[\d]{2}\s[\d]{2}:[\d]{2}:[\d]{2})/)
        if (match) {
          lastOpen = moment(match[1], 'YYYY/MM/DD hh:mm:ss')
        }
      }
    })

    p[app] = lastOpen
    return p
  }, {})
}

function parse(results) {
  const apps = results.filter(i => i);
  const keys = {
    CFBundleDisplayName: 'displayName',
    CFBundleName: 'name',
    CFBundleShortVersionString: 'version'
  }

  return apps.map(app => {
    return {
      displayName: app.CFBundleDisplayName || app.CFBundleName,
      name: app.CFBundleName,
      version: app.CFBundleShortVersionString
    }
  })
}

module.exports = apps

if (require.main === module) {
  apps().then(results => {
    console.log(results)
    process.exit(0)
  }).catch(err => {
    console.error("ERROR", err)
  });
}
