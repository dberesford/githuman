#!/bin/bash
# Simple server management utility

PORT=${PORT:-3849}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

stop_server() {
  pkill -f "node.*serve.*--port.*$PORT" 2>/dev/null
  pkill -f "tsx.*serve.*--port.*$PORT" 2>/dev/null
  # Give it a moment to clean up
  sleep 0.5
  echo "Server stopped"
}

start_server() {
  cd "$PROJECT_DIR"
  node src/cli/index.ts serve --port "$PORT" &
  echo "Server starting on port $PORT..."
  sleep 2
  if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
    echo "Server running at http://localhost:$PORT"
  else
    echo "Server may still be starting..."
  fi
}

restart_server() {
  stop_server
  start_server
}

status_server() {
  if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
    echo "Server is running on port $PORT"
  else
    echo "Server is not running"
  fi
}

case "${1:-}" in
  start)
    start_server
    ;;
  stop)
    stop_server
    ;;
  restart)
    restart_server
    ;;
  status)
    status_server
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    echo "  PORT=$PORT (override with PORT=xxxx)"
    exit 1
    ;;
esac
