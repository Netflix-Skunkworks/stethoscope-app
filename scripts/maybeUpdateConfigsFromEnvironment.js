/**
  This script will update the package.json and src/config.json
  from environment variables.

  Available environment variables:
    - APP_NAME
    - APP_VERSION
    - APP_PUBLISH_URL
    - APP_BUNDLE_ID
    - APP_HELP_EMAIL
    - APP_HELP_SLACK_LINK
    - APP_ALLOW_PRERELEASE_UPDATES
 */
const fs = require('fs')
const path = require('path')
const semver = require('semver')

const writeToFile = (relativeFilePath, data) => {
  const jsonString = JSON.stringify(data, null, 2)
  const absolutePath = path.join(__dirname, relativeFilePath)
  try {
    fs.writeFileSync(absolutePath, jsonString)
    console.log(`Successfully wrote file ${absolutePath}`)
  } catch (err) {
    console.log(`Error writing file ${absolutePath}`, err)
  }
}

if (!process.env.SKIP_CONFIG_UPDATE) {
  console.log('writing config updates')

  const pkg = require('../package.json')
  if (process.env.APP_NAME) {
    pkg.name = process.env.APP_NAME
    pkg.build.productName = process.env.APP_NAME
  }
  if (process.env.APP_VERSION) {
    pkg.version = process.env.APP_VERSION
  }
  if (process.env.APP_PUBLISH_URL) {
    pkg.build.publish[0].url = process.env.APP_PUBLISH_URL
  }
  if (process.env.APP_BUNDLE_ID) {
    pkg.build.appId = process.env.APP_BUNDLE_ID
  }
  if (process.env.APP_VERSION_SUFFIX) {
    const currentVersion = semver(pkg.version)
    pkg.version = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}${process.env.APP_VERSION_SUFFIX}`
  }
  writeToFile('../package.json', pkg)

  const config = require('../src/config.json')
  const shouldUpdateHelp = process.env.APP_HELP_SLACK_LINK && process.env.APP_HELP_EMAIL
  if (shouldUpdateHelp) {
    const help = [
      {
        label: 'Email Support',
        link: `mailto:${process.env.APP_HELP_EMAIL}`
      },
      {
        label: 'Slack Support',
        link: process.env.APP_HELP_SLACK_LINK
      }
    ]
    config.menu.help = help
  }
  if (process.env.APP_ALLOW_PRERELEASE_UPDATES) {
    config.allowPrerelease = true
  }
  writeToFile('../src/config.json', config)
} else {
  console.log('skipping config update')
}
