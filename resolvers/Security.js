const semver = require('../src/lib/patchedSemver')
const pkg = require('../package.json')
const { NUDGE, UNSUPPORTED } = require('../src/constants')
const { Security: PlatformResolvers } = require('./platform/')

const Security = {
  async automaticAppUpdates (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.automaticAppUpdates) {
      return os.automaticAppUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticDownloadUpdates (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.automaticDownloadUpdates) {
      return os.automaticDownloadUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticConfigDataInstall (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.automaticConfigDataInstall) {
      return os.automaticConfigDataInstall(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticSecurityUpdates (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.automaticSecurityUpdates) {
      return os.automaticSecurityUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticOsUpdates (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.automaticOsUpdates) {
      return os.automaticOsUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticUpdates (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.automaticUpdates) {
      return os.automaticUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async remoteLogin (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.remoteLogin) {
      return os.remoteLogin(root, args, context)
    }

    return UNSUPPORTED
  },

  async diskEncryption (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.diskEncryption) {
      return os.diskEncryption(root, args, context)
    }

    return UNSUPPORTED
  },

  async stethoscopeVersion (root, args, context) {
    return semver.satisfies(pkg.version, args.stethoscopeVersion)
  },

  async screenLock (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.screenLock) {
      return os.screenLock(root, args, context)
    }

    return UNSUPPORTED
  },

  async screenIdle (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.screenIdle) {
      return os.screenIdle(root, args, context)
    }

    return UNSUPPORTED
  },

  async osVersion (root, args, context) {
    let plat = context.platform
    const info = context.kmdResponse.system
    // aws workspaces are on a different version than Windows 10
    if (info.version.includes('amazon')) {
      plat = 'awsWorkspace'
    }

    const { ok, nudge } = Object(args.osVersion[plat])
    let { version } = context.kmdResponse.system

    if (semver.satisfies(semver.coerce(version), ok)) {
      return true
    } else if (semver.satisfies(semver.coerce(version), nudge)) {
      return NUDGE
    } else {
      return false
    }
  },

  async publicFirewall (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.publicFirewall) {
      return os.publicFirewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async privateFirewall (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.privateFirewall) {
      return os.privateFirewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async domainFirewall (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.domainFirewall) {
      return os.domainFirewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async firewall (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.firewall) {
      return os.firewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async suggestedApplications (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.suggestedApplications) {
      return os.suggestedApplications(root, args, context)
    }

    return UNSUPPORTED
  },

  async requiredApplications (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.requiredApplications) {
      return os.requiredApplications(root, args, context)
    }

    return UNSUPPORTED
  },

  async bannedApplications (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if (os.bannedApplications) {
      return os.bannedApplications(root, args, context)
    }

    return UNSUPPORTED
  }
}

module.exports = Security
