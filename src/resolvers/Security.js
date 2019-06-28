import semver from '../lib/patchedSemver'
import pkg from '../../package.json'
import {
  NUDGE,
  UNSUPPORTED,
  ALWAYS,
  NEVER,
  SUGGESTED,
  IF_SUPPORTED,
  INVALID_INSTALL_STATE,
  INVALID_VERSION,
  VALID,
  SUGGESTED_INSTALL,
  SUGGESTED_UPGRADE
} from '../constants'
import kmd from '../lib/kmd'
import { PlatformSecurity } from './platform/'

export default {
  async automaticAppUpdates (root, args, context) {
    if ('automaticAppUpdates' in PlatformSecurity) {
      return PlatformSecurity.automaticAppUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticDownloadUpdates (root, args, context) {
    if ('automaticDownloadUpdates' in PlatformSecurity) {
      return PlatformSecurity.automaticDownloadUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticConfigDataInstall (root, args, context) {
    if ('automaticConfigDataInstall' in PlatformSecurity) {
      return PlatformSecurity.automaticConfigDataInstall(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticSecurityUpdates (root, args, context) {
    if ('automaticSecurityUpdates' in PlatformSecurity) {
      return PlatformSecurity.automaticSecurityUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticOsUpdates (root, args, context) {
    if ('automaticOsUpdates' in PlatformSecurity) {
      return PlatformSecurity.automaticOsUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async automaticUpdates (root, args, context) {
    if ('automaticUpdates' in PlatformSecurity) {
      return PlatformSecurity.automaticUpdates(root, args, context)
    }

    return UNSUPPORTED
  },

  async remoteLogin (root, args, context) {
    if ('remoteLogin' in PlatformSecurity) {
      return PlatformSecurity.remoteLogin(root, args, context)
    }

    return UNSUPPORTED
  },

  async diskEncryption (root, args, context) {
    if ('diskEncryption' in PlatformSecurity) {
      return PlatformSecurity.diskEncryption(root, args, context)
    }

    return UNSUPPORTED
  },

  async stethoscopeVersion (root, args, context) {
    return semver.satisfies(pkg.version, args.stethoscopeVersion)
  },

  async screenLock (root, args, context) {
    if ('screenLock' in PlatformSecurity) {
      return PlatformSecurity.screenLock(root, args, context)
    }

    return UNSUPPORTED
  },

  async screenIdle (root, args, context) {
    if ('screenIdle' in PlatformSecurity) {
      return PlatformSecurity.screenIdle(root, args, context)
    }

    return UNSUPPORTED
  },

  async osVersion (root, args, context) {
    const result = await kmd('os', context)
    let { platform, version } = result.system
    // aws workspaces are on a different version than Windows 10
    if (platform === 'awsWorkspace') {
      platform = 'awsWorkspace'
    } else {
      platform = process.platform
    }

    const { ok, nudge } = Object(args.osVersion[platform])

    if (semver.satisfies(semver.coerce(version), ok)) {
      return true
    } else if (semver.satisfies(semver.coerce(version), nudge)) {
      return NUDGE
    } else {
      return false
    }
  },

  async publicFirewall (root, args, context) {
    if ('publicFirewall' in PlatformSecurity) {
      return PlatformSecurity.publicFirewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async privateFirewall (root, args, context) {
    if ('privateFirewall' in PlatformSecurity) {
      return PlatformSecurity.privateFirewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async domainFirewall (root, args, context) {
    if ('domainFirewall' in PlatformSecurity) {
      return PlatformSecurity.domainFirewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async firewall (root, args, context) {
    if ('firewall' in PlatformSecurity) {
      return PlatformSecurity.firewall(root, args, context)
    }

    return UNSUPPORTED
  },

  async applications (root, args, context) {
    if ('applications' in PlatformSecurity) {
      const results = await PlatformSecurity.applications(root, args, context)

      return results.map((data, idx) => {
        const config = args.applications[idx]
        const installed = Boolean(data.version)
        const versionSatisfied = config.version ? semver.satisfies(semver.coerce(data.version), config.version) : true;

        let validInstall
        switch (config.assertion) {
          case ALWAYS:
            validInstall = installed
            break
          case NEVER:
            validInstall = !installed
            break
          case SUGGESTED:
          case IF_SUPPORTED:
          default:
            validInstall = true
            break
        }

        let validVersion
        switch (config.assertion) {
          case ALWAYS:
            validVersion = versionSatisfied
            break
          case NEVER:
            validVersion = !installed
            break
          case IF_SUPPORTED:
            validVersion = installed ? versionSatisfied : true
            break
          case SUGGESTED:
          default:
            validVersion = true
            break
        }

        let state
        if (config.assertion === SUGGESTED) {
          state = !installed ? SUGGESTED_INSTALL : !versionSatisfied ? SUGGESTED_UPGRADE : VALID
        } else {
          state = !validInstall ? INVALID_INSTALL_STATE : !validVersion ? INVALID_VERSION : VALID
        }

        return {
          name: data.name,
          version: installed ? data.version : undefined,
          installed,
          passing: state === VALID,
          state
        }
      })
    }

    return UNSUPPORTED
  }
}
