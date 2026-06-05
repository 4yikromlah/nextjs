#!/bin/bash
cd /home/z/my-project
while true; do
  node custom-server.mjs
  echo "[$(date)] Server died, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
