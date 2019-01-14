const kmd = require('../src/')
const { readFileSync } = require('fs')
const glob = require('glob')
const path = require('path')
const extend = require('extend')

const results = document.querySelector('#data')

const elem = (tag, content, attrs = {}) => {
  const el = document.createElement(tag)
  if (content) el.innerHTML = content
  const { style = {}, ...props } = attrs
  for (const prop in props) {
    el.setAttribute(prop, props[prop])
  }
  for (const rule in style) {
    el.style[rule] = style[rule]
  }
  return el
}

const append = (parent, ...children) => {
  return children.reduce((rent, child) => {
    rent.appendChild(child)
    return parent
  }, parent)
}

function precompile() {
  return new Promise((resolve, reject) => {
    const lookup = path.resolve(__dirname, `../checks/${process.platform}/*.sh`)
    glob(lookup, (er, files) => {
      resolve(
        files.map(async file => {
          const content = readFileSync(file, 'utf8')
          const code = await kmd.compile(content)
          return code
        })
      )
    })
  })
}

const timers = []

function scan(checks, count = 1, average = 0) {
  const start = performance.now()
  const executions = checks.map(async script => kmd.run(await script))

  results.innerHTML = ''

  Promise.all(executions).then(response => {
    const time = Math.round(performance.now() - start)
    const { macAddresses, apps, system } = extend(true, {}, ...response)
    const fragment = document.createDocumentFragment()
    timers.push(time)

    append(fragment,
      elem('h4', `Scan ${count} took ${time}ms | Avg ${average}ms | Min ${Math.min(...timers)} | Max ${Math.max(...timers)}`),
      elem('h3', 'System'),
      elem('div', `${system.platform} ${system.version}`)
    )

    append(fragment,
      elem('h3', 'Applications'),
      apps.reduce((ul, { name, lastOpened }) =>
        append(ul, elem('li', name)),
        elem('ul')
      )
    )

    append(fragment,
      elem('h3', 'Physical Addresses'),
      macAddresses.reduce((ul, { addr, device }) =>
        append(ul, elem('li', `${device}: ${addr}`)),
        elem('ul')
      )
    )

    append(results, fragment)
  })
}

precompile().then(checks => {
  let scanCount = 1
  let average = 0

  scan(checks, scanCount++, average)
  setInterval(() => {
    const average = timers.reduce((p, c) => p + c, 0) / timers.length
    scan(checks, scanCount++, Math.round(average))
  }, 5000)
})
