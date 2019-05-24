import { readFileSync, writeFileSync } from 'fs'
import pkg from './package.json'
import moment from 'moment'

const { build: { publish = [{ url: 'https://test/url/' }] } } = pkg
const [{ url }] = publish
const rev = readFileSync('.git/HEAD').toString()
let revision = rev.trim()

if (rev.includes(':')) {
  const [ , pth ] = rev.split(': ')
  revision = readFileSync(`.git/${pth.trim()}`)
}

const template = readFileSync('./public/download.html', 'utf8')
const replacements = {
  MAC_LINK: `${url}Stethoscope-${pkg.version}.dmg`,
  WIN_LINK: `${url}Stethoscope%20Setup%20${pkg.version}.exe`,
  VERSION: pkg.version,
  BUILD_DATE: moment().format('MMMM Do YYYY'),
  REVISION: String(revision).substr(0, 7),
  REPO: pkg.repository.url
}

const content = Object.entries(replacements).reduce((file, [key, val]) => {
  return file.replace(`{${key}}`, val)
}, template)

writeFileSync('./build/download.html', content)
