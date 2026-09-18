import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'opencode-windows-x64', 'bin', 'opencode.exe')
const destDir = join(root, 'src-tauri', 'binaries')
const dest = join(destDir, 'opencode-x86_64-pc-windows-msvc.exe')
mkdirSync(destDir, { recursive: true })
try {
  copyFileSync(src, dest)
  console.log(`sidecar: ${src} -> ${dest}`)
} catch (error) {
  console.error(
    `sidecar: could not copy ${src}. Install it with: npm i -D opencode-windows-x64@1.18.31`,
  )
  process.exit(1)
}