import { compile, run, setKmdEnv } from 'kmd-script/src'
import path from 'path'
import glob from 'fast-glob'
import extend from 'extend'
import { readFileSync } from 'fs'

const development = process.env.STETHOSCOPE_ENV === 'development'

let checks = false

setKmdEnv({
  FILE_BASE_PATH: !development ? process.resourcesPath + path.sep : process.cwd(),
  NODE_ENV: process.env.STETHOSCOPE_ENV,
  NODE_PATH: process.execPath
})

export async function precompile () {
  const searchPath = path.resolve(__dirname, `../sources/${process.platform}/*.sh`)
  const files = await glob(searchPath)

  return files.reduce((out, file) => {
    const { name } = path.parse(file)
    return {
      ...out,
      [name]: compile(readFileSync(file, 'utf8'))
    }
  }, {})
}

export async function compileAndRun (kmd, variables = {}) {
  const filePath = path.resolve(__dirname, `../sources/${process.platform}/${kmd}.sh`)
  try {
    const fn = compile(readFileSync(filePath, 'utf8'), variables)
    const results = await run(fn)
    return results
  } catch (e) {
    console.error(filePath, e)
    return true
  }
}

/**
 * @deprecated
 */
export async function runAll () {
  const promises = Object.entries(checks).map(async ([name, script]) => {
    try { return await run(script) } catch (e) { return '' }
  })
  const checkData = await Promise.all(promises)
  return extend(true, {}, ...checkData)
}

/**
 * @deprecated
 */
export async function init () {
  checks = await precompile()
  return checks
}

/**
 * @deprecated
 */
export async function evaluate (scriptName) {
  try {
    return await run(checks[scriptName])
  } catch (e) {
    return ''
  }
}
