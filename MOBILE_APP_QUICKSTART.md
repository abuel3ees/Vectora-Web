# Flutter Mobile App - Complete Quick Start Guide

## Phase 1: Prerequisites & Setup

### 1.1 Install Flutter

**macOS:**
```bash
# Download Flutter SDK
cd ~/
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:~/flutter/bin"

# Add to ~/.zshrc permanently
echo 'export PATH="$PATH:$HOME/flutter/bin"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
flutter --version
flutter doctor
```

**Fix any issues from `flutter doctor`:**
```bash
# Install Android SDK
flutter doctor --android-licenses  # Accept all

# Install Xcode (for iOS)
xcode-select --install

# Verify setup
flutter doctor -v
```

### 1.2 Install Required Tools

```bash
# Android Studio (for Android development)
# Download from: https://developer.android.com/studio

# VS Code extensions
code --install-extension Dart-Code.flutter
code --install-extension Dart-Code.dart-code

# Verify
dart --version
flutter --version
```

### 1.3 Get Your Laravel Backend Info

Before building, note:
- **Backend URL**: `http://localhost:8000` (local) or `https://api.vrpfr.com` (production)
- **Mapbox Token**: (if using maps)
- **Firebase Project ID**: (if using push notifications)

---

## Phase 2: Create Flutter Project

### 2.1 Generate New Project

```bash
# Navigate to where you want the project
cd ~/projects/

# Create Flutter app
flutter create vrp_driver_app

cd vrp_driver_app

# Verify it works
flutter pub get
flutter analyze
```

### 2.2 Project Structure Setup

```bash
# Create folders
mkdir -p lib/config
mkdir -p lib/models
mkdir -p lib/services
mkdir -p lib/providers
mkdir -p lib/screens/{auth,home,route,delivery,profile}
mkdir -p lib/widgets/{common,route,delivery,forms}
mkdir -p lib/utils
mkdir -p assets/images
mkdir -p assets/fonts

# Create main.dart skeleton
cat > lib/main.dart << 'EOF'
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VRP Driver',
      theme: ThemeData(
        primarySwatch: Colors.indigo,
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text('VRP Driver App'),
      ),
    );
  }
}
EOF
```

---

## Phase 3: Configure pubspec.yaml

### 3.1 Update Dependencies

```yaml
# pubspec.yaml
name: vrp_driver_app
description: VRP Driver Mobile Application
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  riverpod: ^2.4.8
  flutter_riverpod: ^2.4.8
  hooks_riverpod: ^2.4.8
  flutter_hooks: ^4.4.0
  
  # Networking
  http: ^1.1.0
  dio: ^5.3.0
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0
  
  # Maps
  google_maps_flutter: ^2.5.0
  geolocator: ^10.0.0
  
  # UI
  google_fonts: ^6.1.0
  flutter_svg: ^2.0.7
  cached_network_image: ^3.3.0
  
  # Camera & Images
  camera: ^0.10.5
  image_picker: ^1.0.4
  signature: ^5.3.0
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  
  # Utils
  intl: ^0.19.0
  logger: ^2.1.0
  connectivity_plus: ^5.0.0
  path_provider: ^2.1.1
  permission_handler: ^11.4.0
  uuid: ^4.0.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  
  # Add fonts
  fonts:
    - family: Geist
      fonts:
        - asset: assets/fonts/Geist-Regular.ttf
    - family: InstrumentSerif
      fonts:
        - asset: assets/fonts/InstrumentSerif-Regular.ttf
    - family: JetBrainsMono
      fonts:
        - asset: assets/fonts/JetBrainsMono-Regular.ttf
```

### 3.2 Install Dependencies

```bash
cd vrp_driver_app
flutter pub get
flutter pub upgrade
```

---

## Phase 4: Connect to Laravel Backend

### 4.1 Create API Configuration

Create `lib/config/constants.dart`:

```dart
class Constants {
  // ========== API Configuration ==========
  
  // Local development (your machine running Laravel)
  static const String API_BASE_URL = 'http://192.168.1.100:8000';
  
  // For emulator on same machine
  // static const String API_BASE_URL = 'http://10.0.2.2:8000';
  
  // Production
  // static const String API_BASE_URL = 'https://api.vrpfr.com';
  
  static const String API_TIMEOUT = '30000'; // 30 seconds
  
  // ========== Endpoints ==========
  static const String LOGIN_ENDPOINT = '$API_BASE_URL/api/driver/login';
  static const String PROFILE_ENDPOINT = '$API_BASE_URL/api/driver/profile';
  static const String ROUTES_ENDPOINT = '$API_BASE_URL/api/driver/routes';
  static const String LOCATION_ENDPOINT = '$API_BASE_URL/api/driver/location';
  static const String POD_ENDPOINT = '$API_BASE_URL/api/driver/routes/{{route_id}}/stops/{{stop_id}}/proof-of-delivery';
  
  // ========== Local Storage Keys ==========
  static const String TOKEN_KEY = 'auth_token';
  static const String DRIVER_KEY = 'driver_profile';
  static const String ROUTES_KEY = 'routes_cache';
  
  // ========== Features ==========
  static const bool ENABLE_LOCATION_TRACKING = true;
  static const int LOCATION_UPDATE_INTERVAL_SECONDS = 10;
  static const int LOCATION_DISTANCE_FILTER_METERS = 50;
}
```

### 4.2 Create API Service

Create `lib/services/api_service.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';
import '../config/constants.dart';

class ApiService {
  late Dio _dio;
  final _storage = const FlutterSecureStorage();
  final _logger = Logger();
  
  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Constants.API_BASE_URL,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );
    
    // Add token interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          _logger.i('→ ${options.method} ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          _logger.i('← ${response.statusCode} ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          _logger.e('✗ ${e.response?.statusCode} ${e.message}');
          
          // Handle 401 - refresh token
          if (e.response?.statusCode == 401) {
            // Handle logout
          }
          
          return handler.next(e);
        },
      ),
    );
  }
  
  Future<String?> _getToken() async {
    return await _storage.read(key: Constants.TOKEN_KEY);
  }
  
  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '/api/driver/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      if (response.statusCode == 200) {
        final token = response.data['token'];
        await _storage.write(key: Constants.TOKEN_KEY, value: token);
        return response.data;
      }
      throw Exception('Login failed');
    } catch (e) {
      _logger.e('Login error: $e');
      rethrow;
    }
  }
  
  // Get driver profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/api/driver/profile');
      return response.data;
    } catch (e) {
      _logger.e('Profile error: $e');
      rethrow;
    }
  }
  
  // Get routes
  Future<Map<String, dynamic>> getRoutes({String? date, String? status}) async {
    try {
      final response = await _dio.get(
        '/api/driver/routes',
        queryParameters: {
          if (date != null) 'date': date,
          if (status != null) 'status': status,
        },
      );
      return response.data;
    } catch (e) {
      _logger.e('Routes error: $e');
      rethrow;
    }
  }
  
  // Get single route
  Future<Map<String, dynamic>> getRoute(int routeId) async {
    try {
      final response = await _dio.get('/api/driver/routes/$routeId');
      return response.data;
    } catch (e) {
      _logger.e('Route error: $e');
      rethrow;
    }
  }
  
  // Update stop
  Future<Map<String, dynamic>> updateStop(
    int routeId,
    int stopId,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.patch(
        '/api/driver/routes/$routeId/stops/$stopId',
        data: data,
      );
      return response.data;
    } catch (e) {
      _logger.e('Update stop error: $e');
      rethrow;
    }
  }
  
  // Send location
  Future<void> sendLocation(double lat, double lng) async {
    try {
      await _dio.post(
        '/api/driver/location',
        data: {
          'lat': lat,
          'lng': lng,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      _logger.e('Location error: $e');
      // Don't rethrow - location is non-critical
    }
  }
  
  // Upload proof of delivery
  Future<Map<String, dynamic>> uploadProofOfDelivery(
    int routeId,
    int stopId,
    String notes,
    List<String> photoPaths,
    String? signaturePath,
  ) async {
    try {
      final formData = FormData.fromMap({
        'notes': notes,
        'photos': [
          for (var path in photoPaths)
            await MultipartFile.fromFile(path),
        ],
        if (signaturePath != null)
          'signature': await MultipartFile.fromFile(signaturePath),
      });
      
      final response = await _dio.post(
        '/api/driver/routes/$routeId/stops/$stopId/proof-of-delivery',
        data: formData,
      );
      return response.data;
    } catch (e) {
      _logger.e('POD upload error: $e');
      rethrow;
    }
  }
  
  Future<void> logout() async {
    await _storage.delete(key: Constants.TOKEN_KEY);
  }
}
```

---

## Phase 5: Set Up State Management (Riverpod)

### 5.1 Create Auth Provider

Create `lib/providers/auth_provider.dart`:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

final apiServiceProvider = Provider((ref) => ApiService());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthNotifier(apiService);
});

class AuthState {
  final bool isLoading;
  final String? token;
  final Map<String, dynamic>? driver;
  final String? error;
  
  AuthState({
    this.isLoading = false,
    this.token,
    this.driver,
    this.error,
  });
  
  bool get isAuthenticated => token != null;
  
  AuthState copyWith({
    bool? isLoading,
    String? token,
    Map<String, dynamic>? driver,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      token: token ?? this.token,
      driver: driver ?? this.driver,
      error: error ?? this.error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;
  
  AuthNotifier(this._apiService) : super(AuthState()) {
    _checkToken();
  }
  
  Future<void> _checkToken() async {
    // Check if token exists in secure storage
    // Restore user session
  }
  
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _apiService.login(email, password);
      state = state.copyWith(
        isLoading: false,
        token: result['token'],
        driver: result['driver'],
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
  
  Future<void> logout() async {
    await _apiService.logout();
    state = AuthState();
  }
}
```

### 5.2 Create Routes Provider

Create `lib/providers/routes_provider.dart`:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

final routesProvider = FutureProvider((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final auth = ref.watch(authProvider);
  
  if (!auth.isAuthenticated) return null;
  
  return await apiService.getRoutes();
});

final routeDetailProvider = FutureProvider.family((ref, int routeId) async {
  final apiService = ref.watch(apiServiceProvider);
  return await apiService.getRoute(routeId);
});
```

---

## Phase 6: Build Basic Screens

### 6.1 Login Screen

Create `lib/screens/auth/login_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    final authState = ref.watch(authProvider);
    
    ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        // Navigate to home
        Navigator.of(context).pushReplacementNamed('/home');
      }
    });
    
    return Scaffold(
      appBar: AppBar(title: const Text('VRP Driver Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),
            if (authState.error != null)
              Text(
                authState.error!,
                style: const TextStyle(color: Colors.red),
              ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: authState.isLoading
                    ? null
                    : () {
                        ref.read(authProvider.notifier).login(
                              emailController.text,
                              passwordController.text,
                            );
                      },
                child: authState.isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Login'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 6.2 Home Screen

Create `lib/screens/home/home_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/routes_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routesAsync = ref.watch(routesProvider);
    
    return Scaffold(
      appBar: AppBar(title: const Text('My Routes')),
      body: routesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
        data: (data) {
          if (data == null) {
            return const Center(child: Text('No routes found'));
          }
          
          final routes = data['routes'] as List;
          
          return ListView.builder(
            itemCount: routes.length,
            itemBuilder: (context, index) {
              final route = routes[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  title: Text('Route ${route['route_index']}'),
                  subtitle: Text('${route['num_stops']} stops'),
                  trailing: const Icon(Icons.arrow_forward),
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      '/route-detail',
                      arguments: route['id'],
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

---

## Phase 7: Test Locally

### 7.1 Run on Android Emulator

```bash
# Open Android Studio and create/start emulator
# OR use command line

flutter emulators
flutter emulators launch Pixel_4_API_30

# Run app
flutter run

# See logs
flutter logs
```

### 7.2 Run on iOS Simulator

```bash
# Start simulator
open -a Simulator

# Run app
flutter run -d iphone

# Or specify device
flutter devices
flutter run -d "iPhone 15 Pro"
```

### 7.3 Test with Your Laravel Backend

**First, start Laravel:**
```bash
cd ~/projects/vrpfr/vrpfr
php artisan serve --host 0.0.0.0 --port 8000
```

**Get your machine's IP:**
```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example: 192.168.1.100
```

**Update `lib/config/constants.dart`:**
```dart
static const String API_BASE_URL = 'http://192.168.1.100:8000';
// NOT localhost - apps need the actual IP
```

**Test login API:**
```bash
# From your terminal, test if backend is accessible
curl -X POST http://192.168.1.100:8000/api/driver/login \
  -H "Content-Type: application/json" \
  -d '{"email": "driver@example.com", "password": "password"}'

# Should return: { "token": "...", "driver": {...} }
```

**Emulator can't reach localhost on host machine:**
```
For Android emulator: Use 10.0.2.2:8000 instead of localhost:8000
For iOS simulator: Use localhost:8000 or 127.0.0.1:8000
For physical device: Use your machine's IP address
```

### 7.4 Set Up Test Driver in Laravel

Create a test driver:
```bash
cd ~/projects/vrpfr/vrpfr

# Create migration
php artisan make:seeder DriverSeeder

# In database/seeders/DriverSeeder.php:
<?php
namespace Database\Seeders;

use App\Models\User;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DriverSeeder extends Seeder {
    public function run() {
        $user = User::create([
            'name' => 'Test Driver',
            'email' => 'driver@test.com',
            'password' => Hash::make('password'),
            'role' => 'driver',
        ]);
        
        $vehicle = Vehicle::create([
            'plate' => 'ABC123',
            'make' => 'Toyota',
            'model' => 'Hiace',
            'capacity_kg' => 1000,
        ]);
        
        Driver::create([
            'user_id' => $user->id,
            'vehicle_id' => $vehicle->id,
            'status' => 'available',
        ]);
    }
}

# Run seeder
php artisan db:seed --class=DriverSeeder
```

**Login with:**
- Email: `driver@test.com`
- Password: `password`

---

## Phase 8: Build APK for Android

### 8.1 Generate Signing Key

```bash
# Create keystore (one time only)
keytool -genkey -v -keystore ~/key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload-key

# When prompted:
# Keystore password: [create a password]
# Key password: [same as keystore]
# Other info: Fill in your details
```

### 8.2 Configure Gradle

Create `android/key.properties`:
```properties
storeFile=/Users/YOUR_USERNAME/key.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload-key
```

Update `android/app/build.gradle` - add before `android {`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 8.3 Build Release APK

```bash
flutter clean
flutter build apk --release

# Output: build/app/outputs/apk/release/app-release.apk
```

### 8.4 Build App Bundle (for Play Store)

```bash
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

### 8.5 Install on Physical Device

```bash
# Connect device via USB
flutter devices

# Install APK
flutter install build/app/outputs/apk/release/app-release.apk
```

---

## Phase 9: Build IPA for iOS

### 9.1 Set Up iOS Development

```bash
# Open Xcode project
cd ios
open Runner.xcworkspace  # IMPORTANT: Use .xcworkspace not .xcodeproj

# In Xcode:
# 1. Select Runner in Project Navigator
# 2. Go to Signing & Capabilities
# 3. Select your Apple ID as Team
# 4. Let Xcode update provisioning profiles
```

### 9.2 Build Release IPA

```bash
# Method 1: Using CLI
flutter build ipa --release

# Method 2: Using Xcode
cd ios
xcodebuild -workspace Runner.xcworkspace \
  -scheme Runner -configuration Release \
  -derivedDataPath build/ios_build \
  -arch arm64 build

# Output: Runner.ipa in build/
```

### 9.3 Install on Physical Device

```bash
# Connect device via USB/cable
# In Xcode: Product → Scheme → Runner
# Product → Destination → Select your device
# Product → Build & Run
```

---

## Phase 10: Continuous Testing & Development

### 10.1 Hot Reload vs Hot Restart

```bash
# While `flutter run` is active, press:

# h - Hot reload (quick, code changes only)
# H - Hot restart (slower, full restart with state reset)
# q - Quit
```

### 10.2 Run Tests

```bash
# Unit tests
flutter test

# Widget tests
flutter test test/screens/

# Integration tests
flutter drive --target=test_driver/main.dart

# With coverage
flutter test --coverage
lcov --list coverage/lcov.info
```

### 10.3 Debug Mode

```bash
# Verbose logging
flutter run -v

# Debug from VS Code
# 1. Set breakpoints
# 2. Press F5
# 3. Debugger will pause at breakpoints

# Device logs
flutter logs

# Flutter DevTools
flutter pub global activate devtools
devtools
# Open http://localhost:9105
```

---

## Phase 11: Troubleshooting

### Connection Issues

```bash
# Android Emulator can't reach backend on host
# Use 10.0.2.2 instead of localhost:8000

# iOS Simulator can reach localhost
# Use 127.0.0.1:8000

# Physical device can't reach backend
# Use your machine's IP: 192.168.x.x:8000
# Make sure firewall allows port 8000
```

### Permission Errors

```bash
# Location permission denied
# iOS: Update Info.plist
# Android: Update AndroidManifest.xml + request at runtime

# Camera permission denied
# Use permission_handler package
# Call permission_handler.permission.request()

# Storage access
# Use path_provider for documents, not raw file paths
```

### Build Errors

```bash
# Gradle issues
flutter clean
./gradlew clean
flutter pub get
flutter build apk

# Pod issues (iOS)
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
flutter build ios
```

### API Connection Issues

```dart
// Debug: Print all requests
Dio().interceptors.add(LoggingInterceptor());

// Check network:
final connectivity = Connectivity();
connectivity.checkConnectivity();

// Test endpoint manually:
curl -v http://192.168.1.100:8000/api/driver/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Phase 12: Final Checklist Before Release

- [ ] Test login with real credentials
- [ ] Test all API endpoints
- [ ] Test offline functionality
- [ ] Test on multiple devices/emulators
- [ ] Test with multiple driver accounts
- [ ] Verify permissions are requested
- [ ] Check Firebase setup (if using notifications)
- [ ] Update app version in pubspec.yaml
- [ ] Add app icon (replace default Flutter icon)
- [ ] Add app name and description
- [ ] Test production API endpoint
- [ ] Verify error handling
- [ ] Check performance (no janky animations)
- [ ] Battery drain test (location tracking)
- [ ] Data usage test (large photo uploads)
- [ ] Crash test (kill app, open routes)

---

## Phase 13: Next Steps

1. **First Week**: Set up Flutter, basic screens, login
2. **Second Week**: API integration, routes list, maps
3. **Third Week**: Delivery form, photo/signature
4. **Fourth Week**: Location tracking, offline sync
5. **Fifth Week**: Testing, bug fixes, polish
6. **Sixth Week**: Build APK/IPA, prepare for release
7. **Seventh Week**: Internal testing, final preparation
8. **Eighth Week**: Release to app stores

---

## Quick Reference Commands

```bash
# Project setup
flutter create my_app
flutter pub get
flutter pub upgrade

# Development
flutter run
flutter run -v                    # Verbose
flutter run -d device_name        # Specific device

# Build
flutter build apk --release
flutter build appbundle --release
flutter build ipa --release

# Testing
flutter test
flutter test --coverage
flutter analyze

# Clean
flutter clean
flutter pub cache clean

# Get device info
flutter devices
flutter doctor

# Generate app icon (from image)
# Use FlutterLauncher Icons package
flutter pub add flutter_launcher_icons
flutter pub run flutter_launcher_icons
```

---

## Useful Resources

- **Flutter Docs**: https://flutter.dev/docs
- **Dart Docs**: https://dart.dev/guides
- **Riverpod Docs**: https://riverpod.dev
- **Material Design 3**: https://m3.material.io
- **Pub.dev Packages**: https://pub.dev

---

End of Quick Start Guide
