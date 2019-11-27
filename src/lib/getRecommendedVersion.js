import semver from 'semver'

export default function getRecommendedVersion (semverString) {
  const rules = semverString.split('||')
  let recommended = semver.minVersion(rules.shift())
  if (rules.length) {
    rules.forEach(version => {
      const curMin = semver.minVersion(version)
      if (semver.gt(curMin, recommended)) {
        recommended = curMin
      }
    })
  }
  return recommended
}
