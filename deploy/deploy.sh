#!/usr/bin/env bash
# Deploy / update the app on the server.
# Run from the app directory as a user that can write to it, or as www-data.
# Usage: cd /var/www/vrpfr && bash deploy/deploy.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "=== 1. Pull latest code ==="
git pull --ff-only

echo "=== 2. PHP dependencies ==="
composer install --no-dev --optimize-autoloader --no-interaction

echo "=== 3. JS build ==="
pnpm install --frozen-lockfile
pnpm build

echo "=== 4. Python venv ==="
if [ ! -d scripts/venv ]; then
  python3 -m venv scripts/venv
fi
scripts/venv/bin/pip install --upgrade pip --quiet
scripts/venv/bin/pip install -r scripts/requirements.txt --quiet
echo "Python packages installed."

echo "=== 5. .env sanity check ==="
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.production.example to .env and fill in your values."
  exit 1
fi

# Make sure APP_KEY is set
if grep -q "^APP_KEY=$" .env; then
  php artisan key:generate --force
fi

# Point PYTHON_BIN at the venv
if ! grep -q "^PYTHON_BIN=" .env; then
  echo "PYTHON_BIN=$APP_DIR/scripts/venv/bin/python3" >> .env
fi

echo "=== 6. Storage & permissions ==="
mkdir -p storage/app/vrp/{jobs,cache,graph}
mkdir -p storage/app/public/{delivery-photos,signatures}
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "=== 7. Artisan bootstrap ==="
php artisan migrate --force
php artisan storage:link --force 2>/dev/null || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan wayfinder:generate 2>/dev/null || true

echo "=== 8. Restart services ==="
systemctl restart php8.4-fpm
supervisorctl restart vrpfr-worker

echo ""
echo "Deploy complete. App is live."
