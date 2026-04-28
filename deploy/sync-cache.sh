#!/usr/bin/env bash
# Push local VRP solve-result cache to the production server.
# Pre-computed routes are stored in storage/app/vrp/cache/ — uploading them
# means the server never has to run the heavy Python optimizer for these inputs.
#
# Usage:
#   bash deploy/sync-cache.sh root@<your-droplet-ip>
#
# Optional: also sync the OSMnx road graphs (large files, saves first-run download time):
#   SYNC_GRAPHS=1 bash deploy/sync-cache.sh root@<your-droplet-ip>
set -euo pipefail

SERVER="${1:-}"
if [ -z "$SERVER" ]; then
  echo "Usage: $0 user@server-ip"
  exit 1
fi

REMOTE_APP_DIR="/var/www/vrpfr"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Syncing VRP solve cache → $SERVER ==="
rsync -avz --progress \
  "$LOCAL_DIR/storage/app/vrp/cache/" \
  "$SERVER:$REMOTE_APP_DIR/storage/app/vrp/cache/"

if [ "${SYNC_GRAPHS:-0}" = "1" ]; then
  echo "=== Syncing OSMnx road graphs (this may take a while) ==="
  rsync -avz --progress \
    "$LOCAL_DIR/storage/app/vrp/" \
    "$SERVER:$REMOTE_APP_DIR/storage/app/vrp/" \
    --include="*.graphml" \
    --exclude="jobs/" \
    --exclude="cache/"
fi

echo ""
echo "Cache sync complete. The server will serve cached results without recomputing."
