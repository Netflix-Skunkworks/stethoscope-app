import { compileAndRun } from './scripts'

export default async function kmd (file, context = {}) {
  if (context[file]) {
    return context[file]
  }
  const result = await compileAndRun(file)
  context[file] = result
  return context[file]
}
