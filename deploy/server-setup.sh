#!/usr/bin/env bash
# Run once on a fresh Ubuntu 24.04 DigitalOcean droplet as root.
# Usage: bash server-setup.sh <your-domain-or-ip>
set -euo pipefail

DOMAIN="${1:-_}"
APP_DIR="/var/www/vrpfr"
APP_USER="www-data"

echo "=== 1. System packages ==="
apt-get update -y
apt-get install -y \
  software-properties-common curl git unzip supervisor \
  nginx sqlite3 \
  python3 python3-pip python3-venv python3-dev build-essential

echo "=== 2. PHP 8.4 ==="
add-apt-repository -y ppa:ondrej/php
apt-get update -y
apt-get install -y \
  php8.4-fpm php8.4-cli php8.4-common \
  php8.4-bcmath php8.4-ctype php8.4-curl php8.4-fileinfo \
  php8.4-mbstring php8.4-pdo php8.4-sqlite3 \
  php8.4-tokenizer php8.4-xml php8.4-zip php8.4-intl

echo "=== 3. Composer ==="
if ! command -v composer &>/dev/null; then
  curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

echo "=== 4. Node.js 22 + pnpm ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pnpm

echo "=== 5. App directory ==="
mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"

echo "=== 6. Nginx ==="
cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/vrpfr
sed -i "s|__DOMAIN__|$DOMAIN|g" /etc/nginx/sites-available/vrpfr
sed -i "s|__APP_DIR__|$APP_DIR|g" /etc/nginx/sites-available/vrpfr
ln -sf /etc/nginx/sites-available/vrpfr /etc/nginx/sites-enabled/vrpfr
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "=== 7. PHP-FPM ==="
systemctl enable php8.4-fpm
systemctl restart php8.4-fpm

echo "=== 8. Supervisor (queue worker) ==="
cp "$(dirname "$0")/supervisor.conf" /etc/supervisor/conf.d/vrpfr-worker.conf
sed -i "s|__APP_DIR__|$APP_DIR|g" /etc/supervisor/conf.d/vrpfr-worker.conf
supervisorctl reread
supervisorctl update

echo ""
echo "Server setup complete."
echo "Next: clone your repo into $APP_DIR, copy .env, then run deploy/deploy.sh"
