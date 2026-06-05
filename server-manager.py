#!/usr/bin/env python3
import subprocess
import time
import os
import sys
import signal

def start_server():
    """Start the Node.js server and keep it running"""
    while True:
        print(f"[{time.strftime('%H:%M:%S')}] Starting Next.js server...", flush=True)
        process = subprocess.Popen(
            ['node', 'custom-server.mjs'],
            cwd='/home/z/my-project',
            stdout=open('/home/z/my-project/dev.log', 'a'),
            stderr=subprocess.STDOUT,
            preexec_fn=os.setsid  # Create new process group
        )
        print(f"[{time.strftime('%H:%M:%S')}] Server PID: {process.pid}", flush=True)
        
        # Wait for the process to exit
        process.wait()
        print(f"[{time.strftime('%H:%M:%S')}] Server exited with code {process.returncode}, restarting in 3s...", flush=True)
        time.sleep(3)

if __name__ == '__main__':
    # Handle signals gracefully
    signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))
    signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
    start_server()
