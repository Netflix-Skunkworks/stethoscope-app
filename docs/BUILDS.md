# Creating Builds

You can create builds for all platforms by running:

```
yarn build
```

**Note**: This will not work on Windows machines, you will need to manually delete the `dist/` directory and run:

```bash
yarn build:windows
```

The build process copies assets from the `public/` directory into `build/` via `react-scripts`, `electron-builder` picks up assets from the `build/` directory to bundle into native applications.

## Signing and Notarizing Builds (Mac)

1. Register as an Apple developer
2. Purchase a code-signing certificate and download the PFX bundle
3. Install your code signing certificate to the Mac certificate store
4. Generate an app-specific password for the Apple ID that will be used to [notarize](https://developer.apple.com/news/?id=06032019i) the app. (so don’t have use your regular password!)
5. Add the following environment variables by running:

    ```
    export APP_BUNDLE_ID="com.example-company.stethoscope-local"
    export APPLE_ID="my-apple-id-email@example.com"
    export APPLE_ID_PASS="The app-specific password"
    ```

6. Sign and notarize the app by running:

    ```bash
    yarn build:mac
    ```

## Signing Builds (Windows)

1. Obtain a Microsoft Authenticode code-signing certificate (we use [digicert](digicert.com/code-signing/))
2. Export the private and public key as a `p12` file
3. Use `openssl` to convert p12 to `pvk` and `spc` files

```bash
openssl pkcs12 -in $P12_FILE -nocerts -nodes -out temp-rsa.pem
openssl rsa -in temp-rsa.pem -outform PVK -pvk-strong -out windows-code-cert.pvk

openssl pkcs12 -in $P12_FILE -nokeys -nodes -out temp-cert.pem
openssl crl2pkcs7 -nocrl -certfile temp-cert.pem -outform DER -out windows-code-cert.spc
```

4. If you are on Mac - install `mono`, if you don't have it already

```bash
brew install mono
```

5. Build the windows executable and sign

```bash
yarn build:windows
signcode -$ commercial -a sha1 -t http://timestamp.digicert.com -i $MAIN_URL -spc $SPC_FILE.spc -v $PVK_FILE.pvk -n \"Stethoscope Installer\" \"dist/Stethoscope Setup $npm_package_version.exe\"
```

## Replacing configuration values before build

You can manually change values in `package.json` and `src/config.json` before each build.

Or you can set the following environment variables before build to overwrite the files automatically.

All environment variables are optional and if not present it will use the default values.

## Available environment variables

```
export APP_NAME=Stethoscope-My-Company
export APP_PUBLISH_URL="https://some-other-server.example.com/stethoscope/"
export APP_VERSION_SUFFIX="-my-company.1"
export APP_BUNDLE_ID=com.example.com.stethoscope-local
export APP_HELP_SLACK_LINK="slack://channel?team=<my-team>&id=<channel-id>"
export APP_HELP_EMAIL=support@example.com
export APP_ALLOW_PRERELEASE_UPDATES=true
```

# Supporting Automatic Updates

**NOTE: You will need to codesign Mac and Windows builds for automatic updates to work on either platform**

There are quite a few options in the `electron-builder` docs for automatic updates and we suggest you pick one that is best suited for your organization -  [autotmatic update documentation](https://www.electron.build/configuration/publish).

We use S3 internally as a generic file server and manually deploy the assets (though electron-builder can be configured to push builds to S3), the setup process is essentially:

1. Create a public S3 bucket
2. Ensure that `build.publish` is pointed to your S3 bucket in `package.json`

```javascript
"publish": [
  {
    "provider": "generic",
    "url": "https://s3-us-west-2.amazonaws.com/your-public-s3-bucket/"
  }
]
```
3. Build and sign app(s)
4. Upload signed build artifacts (`dist/*.{dmg,exe,blockmap,yml,zip}`) to S3

Once that is in place, the app's "Check for updates" link in the menu will download new versions and prompt the user to restart.
