#!/bin/bash
while true; do
  # Check if port 3000 is responding
  if ! curl -s -o /dev/null -w '' http://localhost:3000/ 2>/dev/null; then
    cd /home/z/my-project
    bun run dev >> /home/z/my-project/dev.log 2>&1 &
    # Wait for it to start
    sleep 5
  fi
  sleep 3
done
