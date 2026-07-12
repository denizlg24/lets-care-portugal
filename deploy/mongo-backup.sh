#!/usr/bin/env bash
# Nightly mongodump to disk, keeps the last 14 archives.
# Wire up with a cron/systemd-timer as letscarevpn.
set -euo pipefail

BACKUP_DIR="/home/letscarevpn/mongo-backups"
KEEP=14
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

docker exec lets-care-mongo sh -c \
  'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" \
   --authenticationDatabase admin --archive --gzip' \
  > "$BACKUP_DIR/mongo-$STAMP.archive.gz"

# Prune old archives.
ls -1t "$BACKUP_DIR"/mongo-*.archive.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "[backup] wrote $BACKUP_DIR/mongo-$STAMP.archive.gz"
