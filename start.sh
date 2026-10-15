#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
export PORT="${PORT:-8080}"
[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT >= 1024 && PORT <= 65535 )) || { echo 'PORT must be 1024–65535'; exit 1; }
action="${1:-start}"
case "$action" in start|stop|status|build) ;; *) echo 'Usage: bash start.sh [start|stop|status|build]'; exit 1;; esac
if [[ "$action" == build ]]; then
  command -v npm >/dev/null || { echo 'Install Node.js 22 LTS to rebuild.'; exit 1; }
  npm ci --no-audit --no-fund
  npm run typecheck
  npm run build
  exit
fi
mkdir -p .runtime/logs
if [[ "$action" == stop ]]; then
  if [[ -f .runtime/mode ]] && [[ "$(cat .runtime/mode)" == native ]]; then
    nginx -p "$PWD/.runtime/" -c nginx.conf -s quit
  elif [[ -f .runtime/mode ]]; then
    docker compose -p kalder-demo down
  else echo 'Demo is not running.'; fi
  exit
fi
if [[ "$action" == status ]]; then
  if [[ -f .runtime/mode ]] && [[ "$(cat .runtime/mode)" == native ]]; then
    [[ -f .runtime/nginx.pid ]] && kill -0 "$(cat .runtime/nginx.pid)" 2>/dev/null && echo 'nginx running' || { echo 'nginx stopped'; exit 1; }
  elif [[ -f .runtime/mode ]]; then docker compose -p kalder-demo ps
  else echo 'Demo is not running.'; exit 1; fi
  exit
fi
[[ -f dist/index.html ]] || { echo 'Missing dist. Run: bash start.sh build'; exit 1; }
if command -v nginx >/dev/null 2>&1; then
  if [[ -f .runtime/nginx.pid ]] && kill -0 "$(cat .runtime/nginx.pid)" 2>/dev/null; then
    echo 'Demo already running. Use stop before changing PORT or rebuilding.'
    exit
  fi
  cat > .runtime/nginx.conf <<EOF
worker_processes 1;
master_process off;
pid "$PWD/.runtime/nginx.pid";
error_log "$PWD/.runtime/error.log";
events { worker_connections 256; }
http {
  include "$PWD/nginx/mime.types";
  default_type application/octet-stream;
  access_log "$PWD/.runtime/access.log";
  server {
    listen 127.0.0.1:$PORT;
    server_name localhost;
    root "$PWD/dist";
    index index.html;
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header X-Content-Type-Options nosniff always;
    location / { try_files \$uri \$uri/ /index.html; }
    location /assets/ { try_files \$uri =404; }
    location = /healthz { access_log off; default_type text/plain; try_files /healthz.txt =404; }
  }
}
EOF
  nginx -p "$PWD/.runtime/" -c nginx.conf -t
  nginx -p "$PWD/.runtime/" -c nginx.conf
  echo native > .runtime/mode
else
  command -v docker >/dev/null && docker compose version >/dev/null 2>&1 || {
    echo 'Install nginx (Linux/macOS) OR Docker Desktop with Compose, then retry.'; exit 1;
  }
  docker info >/dev/null 2>&1 || { echo 'Start Docker Desktop / Docker Engine first.'; exit 1; }
  docker compose -p kalder-demo up -d --wait
  echo docker > .runtime/mode
fi
url="http://localhost:$PORT"
echo "KALDER demo: $url — stop: bash start.sh stop"
if [[ "${OPEN_BROWSER:-1}" == 1 ]]; then
  if command -v open >/dev/null; then open "$url" || true
  elif command -v xdg-open >/dev/null; then xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v cmd.exe >/dev/null; then cmd.exe /c start "$url" || true; fi
fi
