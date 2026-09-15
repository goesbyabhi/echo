import { structuredPatch } from 'diff'

export type DiffLine = {
  type: 'add' | 'remove' | 'context'
  content: string
  oldNumber: number | null
  newNumber: number | null
}

export type DiffHunk = {
  header: string
  lines: DiffLine[]
}

export function buildDiff(before: string, after: string, fileName = 'file', context = 3): DiffHunk[] {
  const patch = structuredPatch(fileName, fileName, before, after, '', '', { context })
  return patch.hunks.map((hunk) => {
    let oldLine = hunk.oldStart
    let newLine = hunk.newStart
    const lines: DiffLine[] = []
    for (const raw of hunk.lines) {
      const marker = raw[0]
      const content = raw.slice(1)
      if (marker === '+') {
        lines.push({ type: 'add', content, oldNumber: null, newNumber: newLine++ })
      } else if (marker === '-') {
        lines.push({ type: 'remove', content, oldNumber: oldLine++, newNumber: null })
      } else if (marker === '\\') {
        continue
      } else {
        lines.push({ type: 'context', content, oldNumber: oldLine++, newNumber: newLine++ })
      }
    }
    return {
      header: `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
      lines,
    }
  })
}

export function countChanges(before: string, after: string): { additions: number; deletions: number } {
  const hunks = buildDiff(before, after)
  let additions = 0
  let deletions = 0
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'add') additions++
      if (line.type === 'remove') deletions++
    }
  }
  return { additions, deletions }
}
