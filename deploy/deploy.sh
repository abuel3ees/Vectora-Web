

echo "=== 4. Python venv ==="
if [ ! -d scripts/venv ]; then
  python3 -m venv scripts/venv
fi
scripts/venv/bin/pip install --upgrade pip --quiet
scripts/venv/bin/pip install -r scripts/requirements.txt --quiet
echo "Python packages installed."



echo "=== 7. Artisan bootstrap ==="
php artisan storage:link --force 2>/dev/null || true
php artisan config:cache
php artisan route:cache
php artisan view:cache


echo "=== 8. Restart services ==="

echo ""
echo "Deploy complete. App is live."
