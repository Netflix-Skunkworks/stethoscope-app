const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  return await notarize({
    appBundleId: process.env.APP_BUNDLE_ID,
    appPath: `dist/mac/Stethoscope.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
  });
};