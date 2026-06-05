#!/bin/bash
# Check if server is running, if not start it
if ! curl -s -m 2 http://127.0.0.1:3000/ -o /dev/null 2>/dev/null; then
  cd /home/z/my-project
  pkill -f "custom-server" 2>/dev/null
  sleep 1
  node custom-server.mjs >> /home/z/my-project/dev.log 2>&1 &
fi
