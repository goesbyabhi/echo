import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { dirname, extname, join, normalize } from 'node:path'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const HOST = '127.0.0.1'

const args = process.argv.slice(2)
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`)
  if (i !== -1 && args[i + 1]) return args[i + 1]
  return fallback
}

let spaPort = Number(process.env.PORT) || 4173
let serverPort = Number(process.env.OPENCODE_PORT) || 4096
if (flag('port', '') !== '') spaPort = Number(flag('port'))
if (flag('server-port', '') !== '') serverPort = Number(flag('server-port'))
const startServer = args.includes('--no-server') ? false : true

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: HOST })
    socket.setTimeout(600, () => {
      socket.destroy()
      resolve(false)
    })
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
}

function serve() {
  return createServer((req, res) => {
    let pathname
    try {
      pathname = decodeURIComponent(new URL(req.url, `http://${HOST}:${spaPort}`).pathname)
    } catch {
      res.writeHead(400)
      res.end('Bad Request')
      return
    }
    let file = join(DIST, normalize(pathname).replace(/^(\.\.[/\\])+/, ''))
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html')
    if (!existsSync(file)) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream')
    if (file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache')
    const stream = createReadStream(file)
    stream.on('error', () => {
      res.writeHead(404)
      res.end('Not Found')
    })
    res.writeHead(200)
    stream.pipe(res)
  })
}

async function ensureOpencode() {
  if (await portOpen(serverPort)) return null
  const origins = [`http://localhost:${spaPort}`, `http://${HOST}:${spaPort}`]
  const child = spawn(
    'opencode',
    ['serve', '--hostname', HOST, '--port', String(serverPort), ...origins.flatMap((o) => ['--cors', o])],
    { stdio: 'inherit', windowsHide: true },
  )
  child.on('error', (error) => {
    console.error(`[serve] could not start opencode: ${error.message}`)
  })
  return child
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('[serve] dist/ is not built — run "npm run build" first')
  process.exit(1)
}

const child = startServer ? await ensureOpencode() : null

const server = serve()
server.listen(spaPort, HOST, () => {
  console.log()
  console.log('  echo  serve')
  console.log('  ' + '-'.repeat(24))
  console.log(`  ui:       http://localhost:${spaPort}`)
  console.log(`  opencode: ${child ? 'spawned' : startServer ? 'already running' : 'skipped'} at http://${HOST}:${serverPort}`)
  console.log()
})

function stop() {
  if (child && child.exitCode === null) child.kill()
  server.close()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
server.on('close', () => process.exit(0))