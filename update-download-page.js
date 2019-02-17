const { readFileSync, writeFileSync } = require('fs')
const pkg = require('./package.json')
const moment = require('moment')
const { build: { publish = [{ url: 'https://test/url/'}] } } = pkg
const [{ url }] = publish
const rev = readFileSync('.git/HEAD').toString();
let revision = rev;
if (rev.includes(':')) {
  const [ refs, pth ] = rev.split(': ')
  readFileSync(`.git/${pth}`);
}

const template = readFileSync('./public/download.html', 'utf8')
const replacements = {
  MAC_LINK: `${url}Stethoscope-${pkg.version}.dmg`,
  WIN_LINK: `${url}Stethoscope%20Setup%20${pkg.version}.exe`,
  VERSION: pkg.version,
  BUILD_DATE: moment().format('MMMM Do YYYY'),
  REVISION: revision,
  REPO: pkg.repository.url
}

const content = Object.entries(replacements).reduce((file, [key, val]) => {
  return file.replace(`{${key}}`, val)
}, template)

writeFileSync('./build/download.html', content)
