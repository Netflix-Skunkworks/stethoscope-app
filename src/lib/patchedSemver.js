// This patches a long-standing issue with npm/semver:
// https://github.com/npm/node-semver/issues/232
//
// The motivator for this change was supporting Canonical version strings like:
// '16.04', '18.04', etc. These do not parse with npm/semver because they have
// a leading zero in the minor version.  Similarly, version constraints like
// '>=18.04' fail to match coerced version values like '18.4.0' This
// "decorator" solves both of these issues, but should be removed if the
// upstream project someday supports Canonical-style versions.

const semver = require('semver');

const LeadingZeroRE = new RegExp(/0+(\d+)/, "g");

function removeLeadingZeros(numeric) {
  return numeric.replace(LeadingZeroRE, "$1");
}

function trimLeadingSemVerZeros(trimStr) {
  return trimStr.split('.').map(removeLeadingZeros).join('.');
}

function coerceMajorMinorPatch(coerceStr) {
  const versions = coerceStr.split('.');
  for (let i = versions.length; i < 3; i++) {
    versions.push(0);
  }
  return versions.join('.');
}

function safeStr(input) {
  if (typeof input === 'string') {
    return coerceMajorMinorPatch(trimLeadingSemVerZeros(input));
  }
  return input; // clean passthru for coerced semver objects
}

const origCoerce = semver.coerce;
const origSatisfies = semver.satisfies;

semver.coerce = function (str) {
  return origCoerce(safeStr(str));
}

semver.satisfies = function(version, constraint) {
  return origSatisfies(safeStr(version), safeStr(constraint));
}

module.exports = semver;
