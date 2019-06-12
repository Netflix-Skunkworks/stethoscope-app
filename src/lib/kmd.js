import { compileAndRun } from './scripts'

const serializeVariables = (vars = {}) => (Object.keys(vars).length > 0 ? JSON.stringify(vars) : '')

export default async function kmd (file, context = {}, variables = {}) {
  const contextKey = `${file}${serializeVariables(variables)}`
  if (context[contextKey]) {
    return context[contextKey]
  }
  const result = await compileAndRun(file, variables)
  context[contextKey] = result
  return context[contextKey]
}
