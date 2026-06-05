import { spawn } from 'child_process'

const child = spawn('node', ['../../node_modules/.bin/next', 'start', '-p', '3000', '-H', '0.0.0.0'], {
  cwd: '/home/z/my-project',
  stdio: 'inherit',
  env: { ...process.env }
})

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}, restarting...`)
  process.exit(1)  // Exit so bun --hot restarts the whole thing
})

process.on('SIGTERM', () => {
  child.kill()
  process.exit(0)
})
