# VRP Driver Mobile App - Complete Specification

## Overview

This document provides a complete specification for building a Flutter mobile application that allows drivers to:
- View their assigned routes and stops
- Navigate to each stop
- Record delivery/pickup details
- Track route progress in real-time
- Sync data with the backend

The app communicates with a Laravel backend that manages route optimization and dispatch.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter Mobile App                       │
│  (iOS & Android via Flutter framework)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ REST API + WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               Laravel Backend Server                         │
│  - Route Management                                          │
│  - Driver Dispatch                                           │
│  - Stop Status Updates                                       │
│  - Real-time Sync via Pusher/Redis                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  - Drivers, Routes, Stops, Deliveries                        │
│  - Real-time Events & Activity Log                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Backend API Endpoints

### Authentication
```
POST /api/driver/login
  Request: { email, password }
  Response: { token, driver }

POST /api/driver/logout
  Headers: Authorization: Bearer {token}
  Response: { success }

POST /api/driver/refresh-token
  Headers: Authorization: Bearer {token}
  Response: { token }
```

### Driver Profile
```
GET /api/driver/profile
  Headers: Authorization: Bearer {token}
  Response: {
    id: number,
    name: string,
    email: string,
    phone: string,
    vehicle: {
      id: number,
      plate: string,
      make: string,
      model: string,
      capacity: number
    },
    status: 'available' | 'on_route' | 'offline'
  }
```

### Routes & Stops
```
GET /api/driver/routes
  Headers: Authorization: Bearer {token}
  Query: ?date=2026-04-13&status=pending|completed|in_progress
  Response: {
    routes: [
      {
        id: number,
        route_index: number,
        color: string (hex),
        total_distance: number (km),
        num_stops: number,
        status: 'pending' | 'in_progress' | 'completed',
        created_at: timestamp,
        started_at: timestamp,
        completed_at: timestamp,
        stops: [
          {
            id: number,
            node_id: number,
            sequence: number,
            lat: number,
            lng: number,
            address: string,
            stop_type: 'delivery' | 'pickup',
            reference: string,
            notes: string,
            time_window_start: timestamp (nullable),
            time_window_end: timestamp (nullable),
            status: 'pending' | 'in_progress' | 'completed' | 'failed',
            customer: {
              name: string,
              phone: string,
              email: string
            },
            items: [
              {
                id: number,
                description: string,
                quantity: number,
                weight: number,
                dimensions: { length, width, height }
              }
            ]
          }
        ]
      }
    ]
  }

GET /api/driver/routes/{route_id}
  Headers: Authorization: Bearer {token}
  Response: { Single route with full details }

GET /api/driver/routes/{route_id}/directions
  Headers: Authorization: Bearer {token}
  Query: ?from_stop_id=1&to_stop_id=2&mode=driving
  Response: {
    distance: number (meters),
    duration: number (seconds),
    geometry: { type: 'LineString', coordinates: [[lng, lat], ...] },
    polyline: string (encoded polyline)
  }
```

### Stop Updates
```
PATCH /api/driver/routes/{route_id}/stops/{stop_id}
  Headers: Authorization: Bearer {token}
  Request: {
    status: 'in_progress' | 'completed' | 'failed',
    notes: string,
    signature_image_url: string (optional),
    photo_urls: [string],
    items_delivered: [
      {
        item_id: number,
        quantity_delivered: number,
        condition: 'good' | 'damaged' | 'partial'
      }
    ],
    arrival_time: timestamp,
    departure_time: timestamp,
    service_time: number (minutes)
  }
  Response: { stop_updated: true }

POST /api/driver/routes/{route_id}/stops/{stop_id}/proof-of-delivery
  Headers: Authorization: Bearer {token}
  Content-Type: multipart/form-data
  Fields:
    - signature: File
    - photos: File[] (multiple)
    - notes: string
  Response: { pod_id: number, urls: [{ type, url }] }
```

### Route Progress
```
GET /api/driver/routes/{route_id}/progress
  Headers: Authorization: Bearer {token}
  Response: {
    total_stops: number,
    completed_stops: number,
    failed_stops: number,
    remaining_distance: number (km),
    estimated_completion: timestamp,
    current_stop: { ...stop details },
    next_stop: { ...stop details }
  }

POST /api/driver/routes/{route_id}/start
  Headers: Authorization: Bearer {token}
  Response: { route_started: true }

POST /api/driver/routes/{route_id}/complete
  Headers: Authorization: Bearer {token}
  Response: { route_completed: true }
```

### Real-time Location Tracking
```
POST /api/driver/location
  Headers: Authorization: Bearer {token}
  Request: {
    lat: number,
    lng: number,
    accuracy: number (meters),
    speed: number (km/h),
    heading: number (degrees),
    timestamp: timestamp
  }
  Response: { location_recorded: true }
```

### Notifications & Events (WebSocket)
```
WebSocket: wss://api.vrpfr.com/driver/ws?token={token}
  
Events from server:
  - route:assigned { route_id, route_data }
  - route:started { route_id }
  - stop:reminder { route_id, stop_id, minutes_until }
  - traffic:alert { route_id, message, impact_minutes }
  - geofence:entered { stop_id }
  - geofence:exited { stop_id }
  - sync:required { entity_type, reason }
```

### Analytics & History
```
GET /api/driver/statistics
  Headers: Authorization: Bearer {token}
  Query: ?from=2026-01-01&to=2026-04-13
  Response: {
    total_routes: number,
    total_stops: number,
    completed_stops: number,
    failed_stops: number,
    total_distance: number (km),
    average_route_time: number (hours),
    on_time_rate: number (percent),
    customer_rating: number (1-5)
  }

GET /api/driver/delivery-history
  Headers: Authorization: Bearer {token}
  Query: ?limit=50&offset=0&date=2026-04-13
  Response: {
    deliveries: [
      {
        id: number,
        route_id: number,
        stop_id: number,
        reference: string,
        customer: { name, phone },
        delivered_at: timestamp,
        signature_url: string,
        photos: [string]
      }
    ]
  }
```

---

## 2. Database Schema (Backend - Laravel Migrations)

### Tables

```sql
-- Create table: drivers
CREATE TABLE drivers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNIQUE NOT NULL,
  vehicle_id BIGINT NOT NULL,
  status ENUM('available', 'on_route', 'offline') DEFAULT 'offline',
  current_location POINT,
  last_location_update TIMESTAMP,
  total_distance DECIMAL(10,2),
  total_deliveries INT DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_status (status)
);

-- Create table: vehicles
CREATE TABLE vehicles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  plate VARCHAR(20) UNIQUE NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INT,
  capacity_kg DECIMAL(8,2),
  capacity_cbm DECIMAL(8,2),
  registration_expiry DATE,
  insurance_expiry DATE,
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Create table: routes
CREATE TABLE routes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_index INT NOT NULL,
  driver_id BIGINT NOT NULL,
  depot_id INT NOT NULL,
  color VARCHAR(7),
  total_distance DECIMAL(10,2),
  num_stops INT,
  load DECIMAL(8,2),
  status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
  optimization_id BIGINT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  INDEX idx_driver_date (driver_id, created_at),
  INDEX idx_status (status)
);

-- Create table: stops
CREATE TABLE stops (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_id BIGINT NOT NULL,
  node_id INT NOT NULL,
  sequence INT NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  address TEXT,
  stop_type ENUM('delivery', 'pickup') DEFAULT 'delivery',
  reference VARCHAR(100),
  notes TEXT,
  time_window_start TIMESTAMP,
  time_window_end TIMESTAMP,
  status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
  customer_id BIGINT,
  arrival_time TIMESTAMP,
  departure_time TIMESTAMP,
  service_time INT COMMENT 'in minutes',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_route_sequence (route_id, sequence),
  INDEX idx_status (status),
  SPATIAL INDEX idx_coordinates (lat, lng)
);

-- Create table: stop_items
CREATE TABLE stop_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  stop_id BIGINT NOT NULL,
  description VARCHAR(255),
  quantity INT,
  quantity_delivered INT DEFAULT 0,
  weight DECIMAL(8,2),
  length DECIMAL(8,2),
  width DECIMAL(8,2),
  height DECIMAL(8,2),
  condition ENUM('good', 'damaged', 'partial'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
);

-- Create table: proof_of_delivery
CREATE TABLE proof_of_delivery (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  stop_id BIGINT NOT NULL,
  signature_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
);

-- Create table: delivery_photos
CREATE TABLE delivery_photos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  proof_of_delivery_id BIGINT NOT NULL,
  url VARCHAR(255),
  caption TEXT,
  order INT,
  created_at TIMESTAMP,
  FOREIGN KEY (proof_of_delivery_id) REFERENCES proof_of_delivery(id) ON DELETE CASCADE
);

-- Create table: driver_location_history
CREATE TABLE driver_location_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  driver_id BIGINT NOT NULL,
  route_id BIGINT,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(8,2),
  speed DECIMAL(5,2),
  heading INT,
  timestamp TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  INDEX idx_driver_timestamp (driver_id, timestamp),
  SPATIAL INDEX idx_coordinates (lat, lng)
);

-- Create table: customers
CREATE TABLE customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  notes TEXT,
  rating DECIMAL(3,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Create table: driver_notifications
CREATE TABLE driver_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  driver_id BIGINT NOT NULL,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  data JSON,
  read_at TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  INDEX idx_driver_read (driver_id, read_at)
);
```

---

## 3. Flutter App Structure

### Project Organization

```
vrp_driver_app/
├── lib/
│   ├── main.dart                          # App entry point
│   ├── config/
│   │   ├── constants.dart                 # API endpoints, colors
│   │   ├── theme.dart                     # App theme & styling
│   │   └── localization.dart              # i18n translations
│   ├── models/
│   │   ├── driver.dart
│   │   ├── route.dart
│   │   ├── stop.dart
│   │   ├── delivery.dart
│   │   └── location.dart
│   ├── services/
│   │   ├── api_service.dart               # REST API calls
│   │   ├── auth_service.dart              # Login/Token management
│   │   ├── location_service.dart          # GPS tracking
│   │   ├── notification_service.dart      # Push notifications
│   │   ├── websocket_service.dart         # Real-time updates
│   │   ├── storage_service.dart           # Local storage (Hive)
│   │   └── offline_sync_service.dart      # Offline queue
│   ├── providers/                         # State management (Riverpod)
│   │   ├── auth_provider.dart
│   │   ├── driver_provider.dart
│   │   ├── routes_provider.dart
│   │   ├── location_provider.dart
│   │   └── sync_provider.dart
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   ├── splash_screen.dart
│   │   │   └── permissions_screen.dart
│   │   ├── home/
│   │   │   ├── home_screen.dart
│   │   │   ├── routes_list_screen.dart
│   │   │   └── statistics_screen.dart
│   │   ├── route/
│   │   │   ├── route_detail_screen.dart
│   │   │   ├── route_map_screen.dart
│   │   │   └── route_progress_screen.dart
│   │   ├── delivery/
│   │   │   ├── stop_detail_screen.dart
│   │   │   ├── delivery_form_screen.dart
│   │   │   ├── signature_screen.dart
│   │   │   └── photo_capture_screen.dart
│   │   └── profile/
│   │       └── profile_screen.dart
│   ├── widgets/
│   │   ├── common/
│   │   │   ├── app_bar.dart
│   │   │   ├── bottom_nav.dart
│   │   │   └── loading_spinner.dart
│   │   ├── route/
│   │   │   ├── route_card.dart
│   │   │   ├── route_map_view.dart
│   │   │   └── stop_tile.dart
│   │   ├── delivery/
│   │   │   ├── delivery_status_badge.dart
│   │   │   ├── item_list_widget.dart
│   │   │   └── proof_of_delivery_widget.dart
│   │   └── forms/
│   │       ├── custom_text_field.dart
│   │       ├── photo_picker.dart
│   │       └── signature_pad.dart
│   └── utils/
│       ├── validators.dart
│       ├── date_time_utils.dart
│       ├── distance_utils.dart
│       └── logger.dart
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── splash.png
│   │   └── icons/
│   └── fonts/
│       ├── Geist-Regular.ttf
│       ├── InstrumentSerif-Regular.ttf
│       └── JetBrainsMono-Regular.ttf
├── pubspec.yaml
└── analysis_options.yaml
```

### Key Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  riverpod: ^2.4.8
  flutter_riverpod: ^2.4.8
  
  # Networking
  http: ^1.1.0
  dio: ^5.3.0
  web_socket_channel: ^2.4.0
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # Maps & Location
  google_maps_flutter: ^2.5.0
  geolocator: ^10.0.0
  location: ^5.0.0
  
  # UI Components
  google_fonts: ^6.1.0
  flutter_svg: ^2.0.7
  cached_network_image: ^3.3.0
  
  # Camera & Image
  camera: ^0.10.5
  image_picker: ^1.0.4
  image_cropper: ^5.0.0
  signature: ^5.3.0
  
  # Notifications
  firebase_messaging: ^14.7.0
  firebase_core: ^2.24.0
  
  # Utilities
  intl: ^0.19.0
  logger: ^2.1.0
  connectivity_plus: ^5.0.0
  path_provider: ^2.1.1
  permission_handler: ^11.4.0
  
  # UI Enhancement
  shimmer: ^3.0.0
  lottie: ^2.4.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

---

## 4. Authentication Flow

### Login Process

```
1. User enters email & password
2. POST /api/driver/login
3. Receive: { token, driver, refresh_token }
4. Store token in secure storage (Flutter Secure Storage)
5. Store driver profile locally (Hive)
6. Initialize location tracking & WebSocket
7. Navigate to home screen
```

### Token Management

```
1. Every API request includes: Authorization: Bearer {token}
2. On 401 response: Call /api/driver/refresh-token
3. Get new token from server
4. Retry original request
5. On refresh failure: Redirect to login
```

### Logout

```
1. POST /api/driver/logout
2. Clear local storage
3. Close WebSocket connection
4. Stop location tracking
5. Redirect to login screen
```

---

## 5. UI/UX Design

### Screen Hierarchy

#### 1. **Splash Screen** (Auto - 2 seconds)
- Logo animation
- App name
- Check if user is already logged in
- Navigate to login or home

#### 2. **Login Screen**
- Email field
- Password field
- "Forgot Password" link
- Login button
- Error messages
- Keyboard handling

#### 3. **Permissions Screen**
- Request location access (Always)
- Request camera access
- Request photo library access
- Request notification permissions
- "Continue" button

#### 4. **Home Screen** (Tab 1)
- Driver greeting: "Good morning, John!"
- Current status badge (Available/On Route/Offline)
- Active route card (if any)
  - Route number
  - Route color dot
  - Total distance
  - Stops completed / total
  - Progress bar
  - "Start Route" / "Continue" button
- Upcoming routes list
- Empty state if no routes

#### 5. **Routes List Screen** (Tab 2)
- Filter: Today / This Week / Past
- Sort: By time / By distance
- Route cards showing:
  - Route number & color
  - Total stops
  - Total distance
  - Status badge
  - Completion percentage
- Pull to refresh
- "START ROUTE" button for each route

#### 6. **Route Detail Screen**
- Route header with color band
- Distance: X km | Time: ~Y hours | Stops: Z
- Statistics: On time / Failed / Completed
- Map view (50% height, collapsible)
  - Route polyline
  - Depot marker
  - Stop markers (numbered)
  - Current location
  - Zoom to route button
- Stops list below map
  - Each stop as collapsible card with:
    - Stop number & address
    - Customer name & phone
    - Item list
    - Status badge
    - Tap to expand: full details + "Complete Stop" button

#### 7. **Stop/Delivery Screen**
- Stop header: "Stop #3"
- Customer details card
  - Name, phone, email with tap-to-call
- Address with map
- Items checklist
  - Checkbox for each item
  - Drag to reorder (if needed)
  - Quantity delivered input
  - Condition selector (Good/Damaged/Partial)
- Delivery form:
  - Notes textarea
  - Photo upload button (multi-select)
  - Signature capture button
  - "Mark as Delivered" button

#### 8. **Signature Screen**
- Signature pad
- "Clear" button
- "Save" button
- Preview after save

#### 9. **Photo Capture Screen**
- Camera preview
- Capture button
- Take photo / Choose from gallery options
- Crop tool
- Save photo

#### 10. **Statistics Screen** (Tab 3)
- Date picker (today / week / month / custom)
- Statistics cards:
  - Total routes completed
  - Total stops delivered
  - Total distance
  - Average completion time
  - On-time delivery rate
  - Rating
- Chart: Routes per day (bar chart)
- Chart: Delivery times (line chart)

#### 11. **Profile Screen** (Tab 4)
- Driver info card
  - Profile photo
  - Name
  - Email
  - Phone
  - Vehicle info (plate, model)
- Edit profile button
- Settings:
  - Notification preferences
  - Location tracking frequency
  - Data sync on cellular
  - Offline mode preference
- Logout button

### Design System

#### Colors
```
Primary: #4F46E5 (Indigo)
Accent: #EC4899 (Pink)
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Error: #EF4444 (Red)
Background: #0D0D10 (Dark)
Card: #1A1A24 (Darker)
Border: #403E48 (Gray)
Text Primary: #FAFAFA
Text Secondary: #A6A4B0
```

#### Typography
```
Font Family: Geist (primary), Instrument Serif (display), JetBrains Mono (code)

Display: 32px, Bold, Letter-spacing -0.01em
Heading 1: 28px, Bold
Heading 2: 24px, Semibold
Heading 3: 20px, Semibold
Body Large: 16px, Regular
Body: 14px, Regular
Body Small: 12px, Regular
Caption: 10px, Regular
```

#### Spacing
- Base unit: 4px
- Common spacings: 8px, 12px, 16px, 24px, 32px

#### Shadows
```
Elevation 1: offset(0, 2) blur(4) rgba(0,0,0,0.1)
Elevation 2: offset(0, 4) blur(8) rgba(0,0,0,0.15)
Elevation 3: offset(0, 8) blur(16) rgba(0,0,0,0.2)
```

---

## 6. Core Features Implementation

### Real-time Location Tracking

```dart
// location_service.dart
class LocationService {
  static const UPDATE_INTERVAL = 10; // seconds
  static const DISTANCE_THRESHOLD = 50; // meters
  
  Stream<LocationData> getLocationStream() {
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: DISTANCE_THRESHOLD,
        intervalDuration: Duration(seconds: UPDATE_INTERVAL),
      ),
    );
  }
  
  // Send location to backend every 10s or 50m
  Future<void> trackLocation(driverId, routeId) async {
    getLocationStream().listen((location) async {
      await apiService.post('/api/driver/location', {
        'lat': location.latitude,
        'lng': location.longitude,
        'accuracy': location.accuracy,
        'speed': location.speed,
        'heading': location.heading,
        'timestamp': DateTime.now().toIso8601String(),
      });
    });
  }
}
```

### Offline Sync

```dart
// offline_sync_service.dart
class OfflineSyncService {
  final storage = HiveService();
  
  // Queue action locally if offline
  Future<void> queueAction(String action, Map<String, dynamic> data) async {
    await storage.addToQueue(
      OfflineAction(
        id: uuid.v4(),
        action: action,
        data: data,
        timestamp: DateTime.now(),
        synced: false,
      ),
    );
  }
  
  // Sync queue when connection restored
  Future<void> syncQueue() async {
    final queue = await storage.getOfflineQueue();
    for (var action in queue) {
      try {
        await _executeAction(action);
        await storage.markAsSynced(action.id);
      } catch (e) {
        logger.e('Sync failed: $e');
      }
    }
  }
}
```

### Proof of Delivery (POD)

```dart
// delivery_form_screen.dart
class DeliveryFormScreen extends ConsumerWidget {
  Future<void> submitDelivery(
    WidgetRef ref,
    int stopId,
    String notes,
    List<File> photos,
    File signature,
  ) async {
    try {
      final request = MultipartRequest(
        'POST',
        Uri.parse('/api/driver/stops/$stopId/proof-of-delivery'),
      );
      
      request.fields['notes'] = notes;
      
      // Add photos
      for (var photo in photos) {
        request.files.add(
          await MultipartFile.fromPath('photos', photo.path),
        );
      }
      
      // Add signature
      request.files.add(
        await MultipartFile.fromPath('signature', signature.path),
      );
      
      final response = await request.send();
      if (response.statusCode == 200) {
        // Update local stop status
        // Navigate to next stop
      }
    } catch (e) {
      if (!connectivity.hasConnection) {
        // Queue for offline sync
        await offlineSync.queueAction('submit_delivery', {
          'stop_id': stopId,
          'notes': notes,
          'photos': photos.map((f) => f.path).toList(),
          'signature': signature.path,
        });
      }
    }
  }
}
```

### Real-time Map Updates

```dart
// route_map_screen.dart
var map = GoogleMapsController();

// Update marker positions in real-time
final currentStopProvider = FutureProvider((ref) async {
  final route = ref.watch(currentRouteProvider);
  return route.stops.firstWhere((s) => s.status == 'in_progress');
});

// Update camera position as driver moves
ref.listen(locationProvider, (previous, location) {
  map?.animateCamera(
    CameraUpdate.newLatLng(
      LatLng(location.latitude, location.longitude),
    ),
  );
});
```

### Push Notifications

```dart
// notification_service.dart
class NotificationService {
  Future<void> initialize() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    
    // Handle incoming messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _handleNotification(message.data);
    });
    
    // Handle background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _navigateToNotification(message.data);
    });
  }
  
  void _handleNotification(Map<String, dynamic> data) {
    // Parse notification type
    switch (data['type']) {
      case 'route:assigned':
        // Refresh routes
        break;
      case 'stop:reminder':
        // Show reminder dialog
        break;
      case 'traffic:alert':
        // Show alert banner
        break;
    }
  }
}
```

---

## 7. Backend Middleware & Events

### Laravel Middleware

```php
// app/Http/Middleware/DriverAuth.php
class DriverAuth {
    public function handle($request, Closure $next) {
        $token = $request->bearerToken();
        $driver = Driver::where('api_token', $token)->first();
        
        if (!$driver) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $request->merge(['driver' => $driver]);
        return $next($request);
    }
}
```

### Real-time Events (Pusher/Redis)

```php
// app/Events/RouteAssigned.php
class RouteAssigned implements ShouldBroadcast {
    public $route;
    public function broadcastOn() {
        return new PrivateChannel('driver.' . $this->route->driver_id);
    }
    public function broadcastAs() {
        return 'route:assigned';
    }
}

// Broadcast to driver
broadcast(new RouteAssigned($route))->toOthers();
```

### Location Recording Service

```php
// app/Jobs/RecordDriverLocation.php
class RecordDriverLocation implements ShouldQueue {
    public function handle() {
        $driver = Driver::find($this->driver_id);
        $driver->update([
            'current_location' => DB::raw("POINT(?, ?)", [
                $this->lng,
                $this->lat,
            ]),
            'last_location_update' => now(),
        ]);
    }
}
```

---

## 8. Data Sync Strategy

### Initial Sync (First Install)
1. Login → receive auth token
2. Download driver profile
3. Download all assigned routes (last 30 days)
4. Download all stops for each route
5. Download customer details
6. Store all locally in Hive

### Incremental Sync
- Every 30 minutes: Check for new routes
- On route completion: Update stop statuses
- Real-time: WebSocket for critical updates
- On app resume: Full sync of current route

### Sync Conflict Resolution
```
If local timestamp > server timestamp:
  → Use local version (driver is more up-to-date)
If server timestamp > local timestamp:
  → Use server version (server has latest)
If timestamps equal:
  → Use version with most complete data
```

---

## 9. Error Handling & Resilience

### Network Errors
```
- No internet: Queue actions, show offline mode
- 400: Show validation error to user
- 401: Refresh token, retry
- 403: Show permission error
- 500: Show error, allow retry
- Timeout: Queue action, retry with exponential backoff
```

### Location Errors
```
- Permission denied: Show permission dialog
- Location unavailable: Show warning, continue
- Accuracy poor: Warn user
- GPS timeout: Use last known location
```

### Storage Errors
```
- Storage full: Compress old photos, delete cache
- Database corrupted: Rebuild from server
- Disk quota exceeded: Clean up old deliveries
```

---

## 10. Performance Optimization

### App Size
- Min SDK: Android 21 (API 21)
- Target SDK: Android 34
- ProGuard enabled
- ZIP align enabled
- Expected: ~80-120 MB APK

### Memory Management
- Lazy load images (cached_network_image)
- Dispose controllers properly
- Use const widgets
- Limit location update frequency
- Clear location history after 7 days

### Battery Optimization
- Location: 10s interval, 50m distance filter
- Reduce update frequency in background
- Batch API requests
- Use WorkManager for background tasks

---

## 11. Security Considerations

### Token Security
```dart
// Use Flutter Secure Storage for tokens
final storage = FlutterSecureStorage();
await storage.write(
  key: 'auth_token',
  value: token,
  aOptions: _getAndroidOptions(),
  iOptions: _getIOSOptions(),
);
```

### Data Encryption
- Encrypt local database (Hive encryption)
- HTTPS for all API calls
- Certificate pinning for production

### Permissions
- Location: Always (background tracking)
- Camera: Only when taking photos
- Photos: Only when uploading
- Contacts: Only when calling customers

---

## 12. Testing Strategy

### Unit Tests
```
- Models & serialization
- Validators
- Utilities (distance, time)
```

### Widget Tests
```
- Form validation
- Button actions
- Navigation
- State updates
```

### Integration Tests
```
- Login flow
- Route assignment
- Delivery submission
- Offline sync
```

### E2E Tests
```
- Complete delivery workflow
- Notification handling
- Map interaction
```

---

## 13. Deployment

### Android
```
1. Generate signing key
2. Build release APK: flutter build apk --release
3. Upload to Google Play Console
4. Rollout: 25% → 50% → 100%
```

### iOS
```
1. Create provisioning profile
2. Build release IPA: flutter build ipa --release
3. Upload to TestFlight
4. Submit to App Store
```

### Version Management
- Semantic versioning: v1.0.0
- Changelog in releases
- Track compatibility with backend versions

---

## 14. Monitoring & Analytics

### Analytics Events
```
- login_success
- route_started
- route_completed
- stop_delivered
- photo_uploaded
- offline_action_queued
- sync_completed
- error_occurred
```

### Error Tracking (Sentry/Crashlytics)
```
- Runtime exceptions
- Network errors
- Location errors
- Storage errors
```

### Performance Monitoring
```
- App startup time
- API response times
- Map load time
- Sync duration
```

---

## 15. Rollout Timeline

```
Week 1: Setup Flutter project, auth, basic UI
Week 2: API integration, route display, map
Week 3: Delivery workflow, photos, signature
Week 4: Location tracking, offline sync, testing
Week 5: Push notifications, analytics, polish
Week 6: Beta testing, bug fixes, performance
Week 7: Release candidate, internal UAT
Week 8: App Store submission, soft launch
Week 9: Public release, monitoring, support
```

---

## 16. API Integration Checklist

- [ ] Authentication endpoints
- [ ] Route list/detail endpoints
- [ ] Stop update endpoints
- [ ] Location tracking endpoint
- [ ] Photo upload endpoint
- [ ] Signature storage
- [ ] WebSocket for real-time updates
- [ ] Error handling on all endpoints
- [ ] Rate limiting
- [ ] Token refresh mechanism

---

## 17. Flutter App Checklist

- [ ] Project setup & dependencies
- [ ] Authentication flow
- [ ] Permission requests
- [ ] Route listing & filtering
- [ ] Route map display
- [ ] Stop details
- [ ] Delivery form
- [ ] Photo capture
- [ ] Signature capture
- [ ] Offline sync
- [ ] Real-time location tracking
- [ ] Push notifications
- [ ] Statistics screen
- [ ] Profile management
- [ ] Error handling
- [ ] Performance optimization
- [ ] Test coverage
- [ ] App signing & build
- [ ] App Store deployment

---

## 18. Documentation

Each AI agent building this should create:
1. **API Documentation**: Postman collection, endpoint examples
2. **Database Schema**: Visual ER diagram
3. **Flutter Code**: Well-commented, follows Dart conventions
4. **README.md**: Setup instructions, build commands
5. **Architecture Docs**: Component diagrams, flow charts
6. **Testing Docs**: How to run tests, coverage reports

---

End of Mobile App Specification
