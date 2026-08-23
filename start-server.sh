#!/bin/bash
cd /home/z/my-project

# Double-fork to fully daemonize
(
    bun run dev >> /home/z/my-project/dev.log 2>&1
) &
disown
exit 0
