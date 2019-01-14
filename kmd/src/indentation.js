const getIndentation = (line) => {
  const m = line.match(/^(\s+)/)
  return m ? m[1].replace(/\t/g,' ').length/2 : 0
}

const parse = (lines, idx=0, result=[], lastIndent) => {
  while (idx < lines.length) {
    const line = lines[idx]
    // console.error('result now', result)
    // console.error('processing:', line)
    const indent = getIndentation(line)
    // console.error('current indent', indent, 'last indent', lastIndent)
    const delta = indent - lastIndent
    // console.error('delta:', delta)
    if (delta > 0) {
      // console.error('>>')
      // delegate to the next level
      const subsection = parse(lines, idx, [], indent)
      idx+= subsection.length
      result.push(subsection)
      // console.error('-- finished subsection', subsection, '--')
    // } else if (delta < 0) {
    } else if (delta < 0) {
      // console.error('<<')
      // console.error('-- bumping down --')
      // idx++
      // lastIndent = indent-1
      return result
    } else {
      // console.error('handling line', idx, 'of', lines.length)
      result.push(line.trim())
      idx++
      lastIndent = indent
    }
  }
  return result
}

module.exports = parse

if (require.main === module) {
  console.log(parse(`
exec networksetup -listallhardwareports
trim
split
  save line
  extract Device:\s+\w+[^:]+:\s+([0-9a-f:]+)
  save addr
  load line
  extract Device:\s+(\w+)
  save device
  del line
noEmpty
save macAddresses

`.trim().split('\n')))
//   console.log(parse(`line 1
// line 2
//   sub 2a
//   sub 2b
// line 3
//   sub 3a
//     subsub 3a1
//     subsub 3a2
// line 4
// line 5
// `.trim().split('\n')))
}
