const tap = require('tap')
const { runScript } = require('../src/')

tap.test('basic execution', async function(t) {
  const script = `echo hi`
  const output = await runScript(script)
  t.same(output, 'hi')
})
