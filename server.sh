#!/bin/bash
cd /home/z/my-project
while true; do
  bun --bun next dev -p 3000 2>&1
  echo "[watchdog] Restarting in 3s..."
  sleep 3
done
