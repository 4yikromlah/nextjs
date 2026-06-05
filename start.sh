#!/bin/bash
cd /home/z/my-project

# Kill any existing server
pkill -f "next-server" 2>/dev/null
sleep 2

# Start the server in a loop for auto-restart
while true; do
  echo "[$(date)] Starting Next.js server..." >> /home/z/my-project/dev.log
  node ./node_modules/.bin/next start -p 3000 -H 0.0.0.0 >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
