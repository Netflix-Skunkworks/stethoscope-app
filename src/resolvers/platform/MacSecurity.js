import { NUDGE } from '../../constants'
import kmd from '../../lib/kmd'

const MacSecurity = {
  async automaticAppUpdates (root, args, context) {
    const result = await kmd('com.apple.commerce', context)
    return result.updates.autoUpdate !== '0'
  },

  async automaticDownloadUpdates (root, args, context) {
    const result = await kmd('com.apple.SoftwareUpdate', context)
    return result.updates.automaticDownload !== '0'
  },

  async automaticConfigDataInstall (root, args, context) {
    const result = await kmd('com.apple.SoftwareUpdate', context)
    return result.updates.configDataInstall !== '0'
  },

  async automaticSecurityUpdates (root, args, context) {
    const result = await kmd('com.apple.SoftwareUpdate', context)
    return result.updates.criticalUpdateInstall !== '0'
  },

  async automaticOsUpdates (root, args, context) {
    const result = await kmd('com.apple.commerce', context)
    return result.updates.restartRequired !== '0'
  },

  async automaticCheckEnabled (root, args, context) {
    const result = await kmd('com.apple.SoftwareUpdate', context)
    return result.updates.automaticCheckEnabled !== '0'
  },

  async applications (root, args, context) {
    // const result = await kmd('apps', context)
    return []
  },

  async automaticUpdates (root, args, context) {
    const checkEnabled = await MacSecurity.automaticCheckEnabled(root, args, context)
    if (!checkEnabled) {
      return false
    }

    const appUpdates = await MacSecurity.automaticAppUpdates(root, args, context)
    const osUpdates = await MacSecurity.automaticOsUpdates(root, args, context)
    const securityUpdates = await MacSecurity.automaticSecurityUpdates(root, args, context)
    const automaticDownloadUpdates = await MacSecurity.automaticDownloadUpdates(root, args, context)
    const automaticConfigDataInstall = await MacSecurity.automaticConfigDataInstall(root, args, context)

    const missingSuggested = [
      appUpdates,
      osUpdates,
      securityUpdates,
      automaticDownloadUpdates,
      automaticConfigDataInstall
    ].some((setting) => setting !== true)

    if (missingSuggested) {
      return NUDGE
    }

    return true
  },

  async remoteLogin (root, args, context) {
    const result = await kmd('remote-login', context)
    return parseInt(result.remoteLogin, 10) > 0
  },

  async diskEncryption (root, args, context) {
    const result = await kmd('file-vault', context)
    return result.fileVaultEnabled === 'true'
  },

  // TODO when branching logic works in kmd
  async screenLock (root, args, context) {
    // const result = await kmd('screen-lock', context)
    return true
  },

  // TODO implement
  async screenIdle (root, args, context) {
    // const result = await kmd('screen-idle', context)
    return true
  },

  async firewall (root, args, context) {
    const result = await kmd('firewall', context)
    return parseInt(result.firewallEnabled, 10) > 0
  }

  // await kmd('app', context)
  //  async applications (root, args, context) {
  //   const apps = await Device.applications(root, args, context)
  //   const { version: osVersion } = context.kmdResponse.system
  //   const { applications = [] } = args
  //
  //   return applications.filter((app) => {
  //     const { platform = false } = app
  //     // if a platform is required
  //     if (platform) {
  //       if (platform[context.platform]) {
  //         return patchedSemver.satisfies(osVersion, platform[context.platform])
  //       },
  //       return platform.all
  //     },
  //     // no platform specified - default to ALL
  //     return true
  //   }).map(({
  //     exactMatch = false,
  //     name,
  //     version,
  //     platform,
  //     // ignored for now
  //     includePackages
  //   }) => {
  //     let userApp
  //
  //     if (!exactMatch) {
  //       userApp = apps.find((app: IApp) => (new RegExp(name, 'ig')).test(app.name))
  //     } else {
  //       userApp = apps.find((app: IApp) => app.name === name)
  //     },
  //
  //     // app isn't installed - fail
  //     if (!userApp) {
  //       return { name, passing: false, reason: 'NOT_INSTALLED' },
  //     },
  //     // app is out of date - fail
  //     if (version && !patchedSemver.satisfies(userApp.version, version)) {
  //       return { name, passing: false, reason: 'OUT_OF_DATE' },
  //     },
  //
  //     return { name, passing: true },
  //   })
  // },
}

export default MacSecurity
