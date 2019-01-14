var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
const humanize = require('tiny-human-time')

const fs = require('fs')
const { compile, run, runScript } = require('./src/index')

const osScript = fs.readFileSync('checks/darwin/os.sh', 'utf8')
const macAddressScript = fs.readFileSync('checks/darwin/mac-addresses.sh', 'utf8')
const appInfoScript = fs.readFileSync('checks/darwin/apps.sh', 'utf8')

const compiledOsScript = compile(osScript)
const compiledMacAddressScript = compile(macAddressScript)
const compiledAppInfoScript = compile(appInfoScript)

// add tests
suite.add('compile (os.sh)', function() {
  compile(osScript)
})
// .add('run (os.sh)', async function() {
//   await run(compiledOsScript)
// })
.add('runScript (os.sh)', async function() {
  await runScript(osScript)
})
// .add('compile (mac-addresses.sh)', function() {
//   compile(macAddressScript)
// })
// .add('run (mac-addresses.sh)', async function() {
//   await run(compiledMacAddressScript)
// })
.add('runScript (mac-addresses.sh)', async function() {
  await runScript(macAddressScript)
})
// .add('compile (appinfo.sh)', function() {
//   compile(appInfoScript)
// })
// .add('run (appinfo.sh)', async function() {
//   await run(compiledAppInfoScript)
// })
.add('runScript (apps.sh)', async function() {
  await runScript(appInfoScript)
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
  console.log(`  mean time: ${humanize.short(event.target.stats.mean*1000)}`)
  // console.log("event:", event)
})
.on('complete', function() {
  // console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });
