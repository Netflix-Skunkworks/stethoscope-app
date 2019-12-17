const { notarize } = require('electron-notarize')
const pkg = require('../package.json')
const {
  APPLE_API_KEY,
  APPLE_API_ISSUER,
  APPLE_ID,
  APPLE_ID_PASS,
  APP_BUNDLE_ID,
  ASC_PROVIDER,
  CSC_IDENTITY_AUTO_DISCOVERY
} = process.env

exports.default = async function maybeNotarizing (context) {
  const {
    electronPlatformName,
    appOutDir,
    packager: { appInfo: { productFilename } }
  } = context

  const missingCreds = !(APPLE_ID || APPLE_API_KEY)
  const isMac = electronPlatformName === 'darwin'
  const skipDiscover = CSC_IDENTITY_AUTO_DISCOVERY === 'false'
  // don't attempt to notarize if credentials are missing
  if (!isMac || missingCreds || skipDiscover) {
    console.log('skipping notarization', { isMac, missingCreds, skipDiscover })
    return
  }

  const appName = productFilename
  const params = {
    appBundleId: APP_BUNDLE_ID || pkg.build.appId,
    appPath: `${appOutDir}/${appName}.app`
  }

  if (APPLE_API_KEY) {
    if (!APPLE_API_KEY || !APPLE_API_ISSUER) {
      throw new Error(
        'APPLE_API_KEY and APPLE_API_ISSUER env vars are required'
      )
    }
    params.appleApiKey = APPLE_API_KEY
    params.appleApiIssuer = APPLE_API_ISSUER
  } else {
    params.appleId = APPLE_ID
    params.appleIdPassword = APPLE_ID_PASS
  }

  if (ASC_PROVIDER) {
    params.ascProvider = ASC_PROVIDER
  }

  console.log('Notarizing app, coffee time?')
  return notarize(params)
}
