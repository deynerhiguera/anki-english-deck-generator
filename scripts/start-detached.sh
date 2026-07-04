#!/usr/bin/env bash
# Starts the app fully detached from this terminal so it survives shell exit.
# Logs go to ~/.anki-builder.log; the PID is printed for later kill.

set -euo pipefail

LOG="$HOME/.anki-builder.log"
PIDFILE="$HOME/.anki-builder.pid"

if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "Anki Builder is already running (pid $(cat "$PIDFILE"))."
  echo "Stop it with: kill \$(cat $PIDFILE)"
  exit 1
fi

cd "$(dirname "$0")/.."

# Install deps if needed
if [[ ! -d node_modules ]]; then
  npm install
fi

# Build if out/main/index.js is missing
if [[ ! -f out/main/index.js ]]; then
  npm run build
fi

# Launch detached; capture pid
nohup npm run preview >> "$LOG" 2>&1 &
echo $! > "$PIDFILE"

echo "Anki Builder started (pid $(cat "$PIDFILE"))."
echo "Log: $LOG"
echo "Stop with: kill \$(cat $PIDFILE)"
echo "Show window: click the 'Anki' item in your menu bar."