import kmd from './kmd'
import semver from './patchedSemver'

// Filter applications array (specified in validation policy), return only those
// elements appropriate for the running OS platform/version
export default async function applicationPlatformFilter (applications = [], context, platform, version) {
  const osPlatform = platform || process.platform
  const osVersion = version || (await kmd('os', context)).system.version

  return applications.filter((app) => {
    if (!app.platform || app.platform.all) {
      return true
    }
    const platformStringRequirement = app.platform[osPlatform]
    return platformStringRequirement && semver.satisfies(osVersion, platformStringRequirement)
  })
}
