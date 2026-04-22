# 🚀 Complete Local Development Guide

Run **Flutter Mobile App + Laravel Backend + React Webapp** all locally with a shared database.

## 📋 Quick Start (5 minutes)

### One-Command Setup (Automated)

```bash
/Users/abdurahmanal-essa/vrpfr/vrpfrmob/start-dev.sh
```

This opens 3 terminal tabs and starts everything automatically.

---

## 🔧 Manual Setup (If Script Doesn't Work)

### Step 1: Change Flutter API Endpoint

Edit `lib/config/constants.dart`:

```bash
cd /Users/abdurahmanal-essa/vrpfr/vrpfrmob
nano lib/config/constants.dart
```

Find and change:
```dart
static const bool useLocalBackend = true;  // ← Change false to true
```

Save and exit (Ctrl+X, then Y, then Enter).

---

### Step 2: Set Up Laravel Backend

Open **Terminal 1**:

```bash
cd /Users/abdurahmanal-essa/vrpfr/vrpfr

# Install PHP dependencies
composer install

# Create database
touch database/database.sqlite
php artisan migrate --seed

# Start server
php artisan serve
```

You'll see:
```
Starting Laravel development server: http://127.0.0.1:8000
```

✅ **Backend is running at: http://localhost:8000**

---

### Step 3: Start React Webapp

Open **Terminal 2**:

```bash
cd /Users/abdurahmanal-essa/vrpfr/vrpfr

# Install Node dependencies
npm install
# or if using pnpm:
pnpm install

# Start dev server
npm run dev
# or
pnpm dev
```

You'll see:
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

✅ **Webapp is running at: http://localhost:5173**

Open it in your browser!

---

### Step 4: Run Flutter Mobile App

Open **Terminal 3**:

```bash
cd /Users/abdurahmanal-essa/vrpfr/vrpfrmob

# Clean and get dependencies
flutter clean
flutter pub get

# Run on simulator
flutter run

# Or pick specific device:
flutter devices
flutter run -d "device-id"
```

✅ **Mobile app is running!**

---

## 🗺️ Architecture

```
Shared SQLite Database: database/database.sqlite
          ↑         ↑              ↑
          |         |              |
    Laravel API  React Web    Flutter Mobile
  localhost:8000  localhost:5173  Simulator
```

**All 3 share the SAME database**, so changes in the webapp appear instantly in the mobile app! 🎉

---

## 🧪 Test the Setup

### 1️⃣ Test Backend API

```bash
# In a new terminal, test the API:
curl http://localhost:8000/api/driver/assignments

# You should get a JSON response
```

### 2️⃣ Test Webapp

Open browser → http://localhost:5173
- Should see login page
- Try logging in with test credentials

### 3️⃣ Test Mobile App

In the running Flutter app:
- Should be able to navigate
- Should connect to http://localhost:8000 API

---

## 📱 Testing on Physical iPhone

### Option A: Same WiFi Network

1. Find your Mac's IP:
   ```bash
   ifconfig | grep "inet " | grep -vE "127.0.0.1|255.255"
   # Look for 192.168.x.x or 10.x.x.x
   ```

2. Update Flutter API URL to use that IP:
   ```dart
   static const String localBackendUrl = 'http://192.168.1.X:8000';
   ```

3. Make sure iPhone and Mac are on **SAME WiFi**

4. Build and run on iPhone:

   ```bash
   cd /Users/abdurahmanal-essa/vrpfr/vrpfrmob
   flutter run  # Choose your physical device
   ```

---

## 🔄 Common Workflows

### Create a Driver Route in Webapp → See in Mobile App

1. Open http://localhost:5173 (React webapp)
2. Create a new route
3. Go to mobile app
4. Pull to refresh → **New route appears instantly!** ✨

### Update Route Status in Mobile App → See in Webapp

1. In mobile app: Mark delivery as complete
2. Go back to http://localhost:5173
3. Refresh the page → **Status updated!** ✨

---

## 🛠️ Debugging & Troubleshooting

### Backend Not Starting?

```bash
# Check if port 8000 is in use
lsof -i :8000

# If it is, kill the process
kill -9 <PID>

# Or use a different port
php artisan serve --port=8001
```

### Webapp Not Starting?

```bash
# Clear npm cache
cd /Users/abdurahmanal-essa/vrpfr/vrpfr
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database Issues?

```bash
# Reset database completely
cd /Users/abdurahmanal-essa/vrpfr/vrpfr
rm database/database.sqlite
php artisan migrate --seed

# Or just refresh data
php artisan migrate:fresh --seed
```

### Mobile App Can't Connect to Backend?

Check that:
1. Laravel is running: `lsof -i :8000` (should show php)
2. API URL is correct: Check `lib/config/constants.dart`
3. CORS is enabled: Check `config/cors.php`
4. Firewall: Allow port 8000

**Quick test:**
```bash
# From Mac terminal
curl http://localhost:8000/api/driver/assignments

# From mobile app (use your Mac's IP if on physical device)
curl http://192.168.1.X:8000/api/driver/assignments
```

### Flutter Hot Reload Not Working?

```bash
# Full rebuild
flutter clean
flutter pub get
flutter run
```

---

## 📊 API Endpoints Available for Mobile

The Flutter app has access to these endpoints:

```
GET  /api/driver/assignments          # Get your routes/assignments
POST /api/driver/assignments/{id}/status  # Update delivery status
```

These come from `routes/web.php` with `auth:sanctum` middleware.

---

## 🚀 When Ready for Production

### Build Release APK/IOS:

```bash
# iOS Release Build
flutter build ios --release

# Android Release Build (if Android setup complete)
flutter build apk --release
```

### Deploy Laravel Backend:

```bash
# On production server:
git clone <your-repo>
composer install --no-dev
php artisan migrate
php artisan serve  # or use nginx/apache
```

### Deploy React Webapp:

```bash
# On production server:
npm run build
# Deploy dist/ folder to web server
```

---

## 💡 Pro Tips

1. **Keep terminal windows open**: Makes it easy to see errors
2. **Use `flutter logs`**: See app debug output in a separate terminal
3. **Laravel Tinker**: Test queries interactively
   ```bash
   php artisan tinker
   > Route::all();  # See all routes
   ```
4. **Hot Reload**: Press `R` in Flutter terminal to reload (doesn't reset app state)
5. **Hot Restart**: Press `Shift+R` to full restart (resets state)

---

## 📞 Support

If something doesn't work:

1. Run `flutter doctor` to check setup
2. Check `LOCAL_DEVELOPMENT.md` for more details
3. Look at `INSTALL_ON_IPHONE.md` for device-specific issues
4. Run `php artisan migrate:fresh --seed` to reset database

---

## ✅ Checklist

- [ ] Laravel backend running (http://localhost:8000)
- [ ] React webapp running (http://localhost:5173)
- [ ] Flutter app running on simulator
- [ ] Can see data shared between all three
- [ ] Database changes sync instantly
- [ ] Ready to develop locally!

You're all set! 🎉 Enjoy full-stack local development!
