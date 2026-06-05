#!/bin/bash
cd /home/z/my-project
while true; do
  # Kill any existing server
  pkill -f "custom-server" 2>/dev/null
  sleep 1
  
  # Start server and wait for it
  node custom-server.mjs 2>&1 | while read line; do
    echo "[$(date '+%H:%M:%S')] $line" >> /home/z/my-project/dev.log
  done
  
  echo "[$(date '+%H:%M:%S')] Server died, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
