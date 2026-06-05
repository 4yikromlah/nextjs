import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const port = 3000
const hostname = '0.0.0.0'

console.log('Starting Next.js production server...')

const app = next({ dev: false, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url || '/', true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error:', err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })

  server.on('error', (err: any) => {
    console.error('Server error:', err)
  })
}).catch((err: any) => {
  console.error('Failed to prepare:', err)
  process.exit(1)
})
