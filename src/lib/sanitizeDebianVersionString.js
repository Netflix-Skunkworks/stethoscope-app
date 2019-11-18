export default function sanitizeDebianVersionString(version) {
  return version
  .replace(/^\d+:/, '')               // trim leading epoch numbers
  .replace(/[^\d.].*$/, '')           // trim trailing debian-revision strings
  .replace(/(\d+\.\d+\.\d+).*/, '$1') // trim remaining upstream-version to a semver 
}