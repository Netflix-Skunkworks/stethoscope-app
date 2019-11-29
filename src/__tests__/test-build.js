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

const configHandle = fs.readFileSync(path.resolve(__dirname, '../practices/config.yaml'), 'utf8')
const config = yaml.safeLoad(configHandle)

const policyHandle = fs.readFileSync(path.resolve(__dirname, '../practices/policy.yaml'), 'utf8')
const policy = yaml.safeLoad(policyHandle)

policy.stethoscopeVersion = `>=${pkg.version}`

const paths = {
  darwin: `dist/mac/${pkg.name}.app/Contents/MacOS/${pkg.name}`,
  win32: `dist/win-unpacked/${pkg.name}.exe`,
  linux: `dist/linux-unpacked/${pkg.name.toLowerCase()}`
}

const app = new Application({
  path: paths[process.platform],
  args: [path.join(__dirname, '..'), 'testMode']
})

async function scan (origin) {
  const { stdout } = await exec(`curl -H "Origin: ${origin}" --verbose 'http://127.0.0.1:37370/graphql?query=query%20ValidateDevice($policy:%20DevicePolicy!)%20%7B%0A%20%20policy%20%7B%0A%20%20%20%20validate(policy:%20$policy)%20%7B%0A%20%20%20%20%20%20status%0A%20%20%20%20%20%20osVersion%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%20%20stethoscopeVersion%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20%0A%20%20device%20%7B%0A%20%20%20%20deviceId%0A%20%20%20%20deviceName%0A%20%20%20%20platform%0A%20%20%20%20platformName%0A%20%20%20%20friendlyName%0A%20%20%20%20osVersion%0A%20%20%20%20osName%0A%20%20%20%20osBuild%0A%20%20%20%20firmwareVersion%0A%20%20%20%20hardwareModel%0A%20%20%20%20hardwareSerial%0A%20%20%20%20stethoscopeVersion%0A%20%20%20%20ipAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20address%0A%20%20%20%20%20%20mask%0A%20%20%20%20%20%20broadcast%0A%20%20%20%20%7D%0A%20%20%20%20macAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20mac%0A%20%20%20%20%20%20physicalAdapter%0A%20%20%20%20%20%20lastChange%0A%20%20%20%20%7D%0A%20%20%20%20security%20%7B%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%20%20automaticAppUpdates%0A%20%20%20%20%20%20automaticSecurityUpdates%0A%20%20%20%20%20%20automaticOsUpdates%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22policy%22:%20%7B%0A%20%20%20%20%22stethoscopeVersion%22:%20%22%3E=1.0.0%22,%0A%20%20%20%20%22osVersion%22:%20%7B%0A%20%20%20%20%20%20%22darwin%22:%20%7B%0A%20%20%20%20%20%20%20%20%22ok%22:%20%22%3E=10.13.4%22,%0A%20%20%20%20%20%20%20%20%22nudge%22:%20%22%3E=10.12.6%22%0A%20%20%20%20%20%20%7D,%0A%20%20%20%20%20%20%22win32%22:%20%7B%0A%20%20%20%20%20%20%20%20%22ok%22:%20%22%3E=10.0.16299%22,%0A%20%20%20%20%20%20%20%20%22nudge%22:%20%22%3E=10.0.15063%22%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D,%0A%20%20%20%20%22firewall%22:%20%22ALWAYS%22,%0A%20%20%20%20%22diskEncryption%22:%20%22ALWAYS%22,%0A%20%20%20%20%22automaticUpdates%22:%20%22SUGGESTED%22,%0A%20%20%20%20%22screenLock%22:%20%22IF_SUPPORTED%22,%0A%20%20%20%20%22remoteLogin%22:%20%22NEVER%22%0A%20%20%7D%0A%7D&sessionId=034fad3d-9352-f41f-848b-76794010fc25&operationName=ValidateDevice'`)

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
    console.log(chalk.green('✓'), 'correct version in title')

    const devToolsOpen = await app.browserWindow.isDevToolsOpened()
    assert.strict.equal(devToolsOpen, false)
    console.log(chalk.green('✓'), 'dev tools are closed')

    await app.client.waitUntilTextExists('.last-updated', 'Last scanned by Stethoscope', 10000)
    console.log(chalk.green('✓'), 'app scan successful')

    console.log(chalk.yellow('\n============================ REMOTE SCANNING ============================\n'))

    const response = await scan('stethoscope://main')
    if (response !== false) {
      const timing = Math.round(response.extensions.timing.total / 1000 * 100) / 100
      console.log(chalk.green('✓'), `[Remote:Application]\tscan from trusted 'stethoscope://main' successful\t${chalk.yellow(`${timing} seconds`)}`)
    }

    if (await scan('https://malicious.ru') === false) {
      console.log(chalk.green('✓'), '[Remote:Untrusted]\tscan from untrusted \'https://malicious.ru\' failed')
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
    const timings = []

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

    console.log('\n', chalk.green('✓'), 'load test passed\n')
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
