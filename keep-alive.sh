#!/bin/bash
cd /home/z/my-project

# Kill any existing
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Start server
node ./node_modules/.bin/next dev -p 3000 -H 0.0.0.0 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID" > /tmp/cbt-server-pid
echo "Server started with PID $SERVER_PID"

# Keep running - this prevents the script from exiting and killing the child
wait $SERVER_PID
