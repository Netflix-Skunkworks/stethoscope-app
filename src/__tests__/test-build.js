// A simple test to verify a visible window is opened with a title
const { Application } = require('spectron')
const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const util = require('util')
const chalk = require('chalk')
const exec = util.promisify(require('child_process').exec)
const pkg = require('../../package.json')

const configHandle = fs.readFileSync(path.resolve(__dirname, '../../practices/config.yaml'), 'utf8')
const config = yaml.safeLoad(configHandle)

const policyHandle = fs.readFileSync(path.resolve(__dirname, '../../practices/policy.yaml'), 'utf8')
const policy = yaml.safeLoad(policyHandle)

policy.stethoscopeVersion = `>=${pkg.version}`

const paths = {
  darwin: 'dist/mac/Stethoscope.app/Contents/MacOS/Stethoscope',
  win32: 'dist/win-unpacked/Stethoscope.exe'
}
const app = new Application({
  path: paths[process.platform]
})

async function scan (origin) {
  const { stdout } = await exec(`curl -H "Origin: ${origin}" --verbose 'http://127.0.0.1:37370/graphql?query=query%20ValidateDevice(%24policy%3A%20DevicePolicy!)%20%7B%0A%20%20policy%20%7B%0A%20%20%20%20validate(policy%3A%20%24policy)%20%7B%0A%20%20%20%20%20%20status%0A%20%20%20%20%20%20osVersion%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%20%20stethoscopeVersion%0A%20%20%20%20%20%20requiredApplications%20%7B%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20status%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20%0A%20%20device%20%7B%0A%20%20%20%20deviceId%0A%20%20%20%20deviceName%0A%20%20%20%20platform%0A%20%20%20%20platformName%0A%20%20%20%20friendlyName%0A%20%20%20%20osVersion%0A%20%20%20%20osName%0A%20%20%20%20osBuild%0A%20%20%20%20firmwareVersion%0A%20%20%20%20hardwareModel%0A%20%20%20%20hardwareSerial%0A%20%20%20%20stethoscopeVersion%0A%20%20%20%20ipAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20address%0A%20%20%20%20%20%20mask%0A%20%20%20%20%20%20broadcast%0A%20%20%20%20%7D%0A%20%20%20%20macAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20mac%0A%20%20%20%20%20%20physicalAdapter%0A%20%20%20%20%20%20lastChange%0A%20%20%20%20%7D%0A%20%20%20%20security%20%7B%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%20%20automaticAppUpdates%0A%20%20%20%20%20%20automaticSecurityUpdates%0A%20%20%20%20%20%20automaticOsUpdates%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20"policy"%3A%20%7B%0A%20%20%20%20"stethoscopeVersion"%3A%20">%3D1.0.0"%2C%0A%20%20%20%20"osVersion"%3A%20%7B%0A%20%20%20%20%20%20"darwin"%3A%20%7B%0A%20%20%20%20%20%20%20%20"ok"%3A%20">%3D10.13.4"%2C%0A%20%20%20%20%20%20%20%20"nudge"%3A%20">%3D10.12.6"%0A%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20"win32"%3A%20%7B%0A%20%20%20%20%20%20%20%20"ok"%3A%20">%3D10.0.16299"%2C%0A%20%20%20%20%20%20%20%20"nudge"%3A%20">%3D10.0.15063"%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%2C%0A%20%20%20%20"firewall"%3A%20"ALWAYS"%2C%0A%20%20%20%20"diskEncryption"%3A%20"ALWAYS"%2C%0A%20%20%20%20"automaticUpdates"%3A%20"SUGGESTED"%2C%0A%20%20%20%20"screenLock"%3A%20"IF_SUPPORTED"%2C%0A%20%20%20%20"remoteLogin"%3A%20"NEVER"%2C%0A%20%20%20%20"requiredApplications"%3A%20%5B%7B%0A%20%20%20%20%20%20"name"%3A"Big-IP"%2C%0A%20%20%20%20%20%20"url"%3A"https%3A%2F%2Fwww.google.com%2Fchrome%2F"%0A%20%20%20%20%7D%5D%0A%20%20%7D%0A%7D&sessionId=034fad3d-9352-f41f-848b-76794010fc25&operationName=ValidateDevice'`)

  try {
    return JSON.parse(stdout)
  } catch (e) {
    return false
  }
}

function round (n) {
  return Math.round(n * 100) / 100
}

function standardDeviation (values) {
  const avg = average(values)
  const squareDiffs = values.map(value => {
    const diff = value - avg
    return diff * diff
  })

  const avgSquareDiff = average(squareDiffs)

  return Math.sqrt(avgSquareDiff)
}

function average (data) {
  const sum = data.reduce((sum, value) => sum + value, 0)
  return sum / data.length
}

console.log(chalk.magenta('\n========================== STETHOSCOPE SMOKE TEST =========================='))

async function main () {
  try {
    await app.start()

    console.log(chalk.yellow('\n============================ STANDALONE TESTS ============================\n'))

    const isVisible = await app.browserWindow.isVisible()
    assert.strict.equal(isVisible, true)
    console.log(chalk.green('✓'), 'app is visible')

    const title = await app.client.getTitle()
    assert.strict.equal(title, `Stethoscope (v${pkg.version})`)
    console.log(chalk.green('✓'), `correct version in title`)

    const devToolsOpen = await app.browserWindow.isDevToolsOpened()
    assert.strict.equal(devToolsOpen, false)
    console.log(chalk.green('✓'), 'dev tools are closed')

    await app.client.waitUntilTextExists('.last-updated', 'Last scanned by Stethoscope a few seconds ago', 10000)
    console.log(chalk.green('✓'), 'app scan successful')

    console.log(chalk.yellow('\n============================ REMOTE SCANNING ============================\n'))

    let response = await scan('stethoscope://main')
    if (response !== false) {
      const timing = Math.round(response.extensions.timing.total / 1000 * 100) / 100
      console.log(chalk.green('✓'), `[Remote:Application]\tscan from trusted 'stethoscope://main' successful\t${chalk.yellow(`${timing} seconds`)}`)
    }

    if (await scan('https://malicious.ru') === false) {
      console.log(chalk.green('✓'), `[Remote:Untrusted]\tscan from untrusted 'https://malicious.ru' failed`)
    }

    if (config.testHosts && Array.isArray(config.testHosts)) {
      for (const { url, label } of config.testHosts) {
        const response = await scan(url)
        const timing = Math.round(response.extensions.timing.total / 1000 * 100) / 100
        if (response !== false) {
          console.log(chalk.green('✓'), `[Remote:${label}]\tscan from test URL '${url}' successful\t${chalk.yellow(`${timing} seconds`)}`)
        }
      }
    }

    const LOAD = 30
    let timings = []

    console.log(chalk.yellow('\n============================ LOAD TESTS ============================\n'))

    for (let i = 0; i < LOAD; i++) {
      const response = await scan('stethoscope://main')
      const timing = Math.round(response.extensions.timing.total / 1000 * 100) / 100
      timings.push(timing)
      console.log(chalk.green('✓'), `[LOADTEST ${i + 1}]\tscan took ${timing} seconds`)
      // await sleep(.5)
    }

    timings.sort()

    const totalProcessingTime = timings.reduce((p, c) => p + parseFloat(c), 0)

    console.log('\n', chalk.green('✓'), `load test passed\n`)
    console.log(chalk.cyan(`Load timing (seconds) for ${LOAD} requests:\n`))

    console.log('\t', chalk.cyan('Average:\t'), round(average(timings)))
    console.log('\t', chalk.cyan('SD:\t\t'), round(standardDeviation(timings)))
    console.log('\t', chalk.cyan('Longest:\t'), timings[timings.length - 1])
    console.log('\t', chalk.cyan('Shortest:\t'), timings[0])
    console.log('\t', chalk.cyan('Total:\t\t'), round(totalProcessingTime))

    console.log('\n', chalk.green('✓'), 'ALL TESTS PASSED!')

    await app.stop()
    process.exit(0)
  } catch (e) {
    console.error(chalk.red('X'), 'Test failed', e.message)
    await app.stop()
    process.exit(1)
  }
}

main()
