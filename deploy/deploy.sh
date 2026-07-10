#!/usr/bin/env bash
# Poll master, and if it moved, rebuild + reload the app.
# Triggered by lets-care-deploy.timer (systemd) every 2 min.
set -euo pipefail

APP_DIR="/opt/lets-care-portugal"
BRANCH="master"
APP_NAME="lets-care"

# systemd has a minimal PATH; make bun + pm2 reachable.
export HOME="/home/letscarevpn"
export PATH="$HOME/.bun/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"

cd "$APP_DIR"

git fetch origin "$BRANCH" --quiet

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[deploy] up to date ($LOCAL)"
  exit 0
fi

echo "[deploy] $LOCAL -> $REMOTE, deploying"

# Discard any drift; .env is gitignored so it is preserved.
git reset --hard "origin/$BRANCH"

bun install --frozen-lockfile
bun run build

# Zero-ish downtime restart, pick up any .env changes.
pm2 restart "$APP_NAME" --update-env
pm2 save

echo "[deploy] done: $(git rev-parse HEAD)"
