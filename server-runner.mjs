import { spawn } from 'child_process';
import { createWriteStream } from 'fs';

const log = createWriteStream('/home/z/my-project/dev.log', { flags: 'a' });

function startServer() {
  const child = spawn('node', ['./node_modules/.bin/next', 'start', '-p', '3000', '-H', '0.0.0.0'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', log, log],
    detached: true,
    unref: false
  });
  
  child.on('exit', (code) => {
    log.write(`Server exited with code ${code}, restarting in 3s...\n`);
    setTimeout(startServer, 3000);
  });
  
  log.write(`Server started with PID ${child.pid}\n`);
}

startServer();
