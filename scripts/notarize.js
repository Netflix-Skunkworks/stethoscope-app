const { notarize } = require('electron-notarize')
const pkg = require('../package.json')

exports.default = async function notarizing (context) {
  const {
    electronPlatformName,
    appOutDir,
    packager: { appInfo: { productFilename }}
  } = context

  if (electronPlatformName !== 'darwin') {
    return
  }

  const {
    APPLE_API_KEY,
    APPLE_API_ISSUER,
    APPLE_ID,
    APPLE_ID_PASS,
    APP_BUNDLE_ID,
    ASC_PROVIDER,
    CSC_IDENTITY_AUTO_DISCOVERY
  } = process.env

  if (CSC_IDENTITY_AUTO_DISCOVERY === 'false') {
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

  return notarize(params)
}
