# VRPFR: Fleet Routing & Dispatch Platform
## Complete System Architecture Report

**Date:** May 1, 2026  
**Stack:** Laravel 13 + Inertia.js + React 19 + TypeScript + Flutter (mobile)  
**Database:** SQLite (dev), PostgreSQL (production-ready)

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [Core Data Models](#core-data-models)
3. [User Journeys & Pipelines](#user-journeys--pipelines)
4. [Route Optimization Flow](#route-optimization-flow)
5. [Driver Assignment Lifecycle](#driver-assignment-lifecycle)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Surface](#api-surface)
8. [Key Operations](#key-operations)

---

## Database Schema

### Application Tables (App-Owned)

#### `users` (Authentication & Identity)
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(100) NULL,
  
  -- Two-factor authentication (Fortify)
  two_factor_secret TEXT NULL,
  two_factor_recovery_codes TEXT NULL,
  two_factor_confirmed_at TIMESTAMP NULL,
  
  -- Presence & mobile
  last_seen_at TIMESTAMP NULL,
  fcm_token VARCHAR(255) NULL,  -- Firebase Cloud Messaging for push
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

**Roles via Spatie Permission:**  
- `dispatcher`: can view/create/edit routes, send messages, manage users, view analytics
- `driver`: can accept assignments, record deliveries, upload photos/signatures, post location

---

#### `dispatch_routes` (Named Route Groups)
```sql
CREATE TABLE dispatch_routes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(255) DEFAULT 'pending',  -- pending|in_progress|completed
  description TEXT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_dispatch_routes_name ON dispatch_routes(name);
CREATE INDEX idx_dispatch_routes_status ON dispatch_routes(status);
```

**Relationship to assignments:** `dispatch_routes.name = driver_assignments.instance`  
**Purpose:** Logical grouping of solver output; one route record per optimization run

---

#### `driver_assignments` (Vehicle Routes & Stops)
```sql
CREATE TABLE driver_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  driver_id BIGINT NOT NULL,  -- FK → users
  instance VARCHAR(255) NOT NULL,  -- links to dispatch_routes.name
  algorithm VARCHAR(255) NOT NULL,  -- e.g. 'tabu_search', 'recursive_qaoa'
  vehicle_index SMALLINT UNSIGNED NOT NULL,  -- 0-based vehicle index in solution
  
  color VARCHAR(16) NULL,  -- hex color for map display
  total_distance FLOAT NULL,  -- km or distance units
  num_stops SMALLINT UNSIGNED NULL,  -- non-depot stops count
  
  -- Full stops payload: [{ node_id, lat, lng, snapped_lat, snapped_lng, is_depot, recipient_name, recipient_phone, address, notes }, ...]
  stops JSON NOT NULL,
  
  -- Per-stop status tracking: [{ status, notes, failure_reason, recorded_at }, ...]
  stop_statuses JSON NULL,
  
  -- Street-snapped route geometry: [[lng, lat], [lng, lat], ...] (GeoJSON order)
  geometry JSON NULL,
  
  -- Lifecycle
  status VARCHAR(255) DEFAULT 'pending',  -- pending|accepted|in_progress|completed|cancelled
  assigned_at TIMESTAMP NULL,
  accepted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_assignments_driver_id ON driver_assignments(driver_id);
CREATE INDEX idx_assignments_driver_status ON driver_assignments(driver_id, status);
CREATE INDEX idx_assignments_instance ON driver_assignments(instance);
CREATE INDEX idx_assignments_status ON driver_assignments(status);
```

**Purpose:** Operational unit: one driver + one vehicle + one route = one assignment

---

#### `driver_locations` (GPS Tracking)
```sql
CREATE TABLE driver_locations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  driver_assignment_id BIGINT NOT NULL,  -- FK → driver_assignments
  
  latitude DECIMAL(10, 8) NOT NULL,  -- -90 to +90
  longitude DECIMAL(11, 8) NOT NULL,  -- -180 to +180
  accuracy FLOAT NULL,  -- meters
  speed FLOAT NULL,  -- m/s
  heading SMALLINT UNSIGNED NULL,  -- 0–360 degrees
  recorded_at TIMESTAMP NOT NULL,  -- device timestamp
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
FOREIGN KEY (driver_assignment_id) REFERENCES driver_assignments(id) ON DELETE CASCADE;
CREATE INDEX idx_locations_assignment ON driver_locations(driver_assignment_id);
CREATE INDEX idx_locations_assignment_timestamp ON driver_locations(driver_assignment_id, recorded_at);
CREATE INDEX idx_locations_recorded_at ON driver_locations(recorded_at);
```

**Purpose:** Live telemetry stream; dispatchers poll this for real-time fleet map

---

#### `delivery_photos` (Proof of Delivery)
```sql
CREATE TABLE delivery_photos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  driver_assignment_id BIGINT NOT NULL,  -- FK → driver_assignments
  stop_raw_index INT NOT NULL,  -- 0-based index into stops JSON array
  
  -- Photo or signature (or both)
  photo_url VARCHAR(255) NULL,  -- /storage/delivery-photos/{assignmentId}/{stopIndex}/{timestamp}.jpg
  notes TEXT NULL,
  uploaded_at TIMESTAMP NULL,
  
  -- Photo geo-verification
  photo_lat DOUBLE NULL,
  photo_lng DOUBLE NULL,
  stop_lat DOUBLE NULL,
  stop_lng DOUBLE NULL,
  location_distance_m DOUBLE NULL,  -- haversine distance in meters
  location_verified BOOLEAN DEFAULT false,  -- true if ≤50m from stop
  photo_taken_at TIMESTAMP NULL,
  
  -- Signature
  signature_url VARCHAR(255) NULL,  -- /storage/signatures/{assignmentId}/{stopIndex}/{timestamp}.png
  signature_captured_at TIMESTAMP NULL,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
FOREIGN KEY (driver_assignment_id) REFERENCES driver_assignments(id) ON DELETE CASCADE;
CREATE INDEX idx_photos_assignment ON delivery_photos(driver_assignment_id);
CREATE INDEX idx_photos_assignment_stop ON delivery_photos(driver_assignment_id, stop_raw_index);
CREATE INDEX idx_photos_verified ON delivery_photos(driver_assignment_id, location_verified);
```

**Purpose:** Pod (proof of delivery); typically one photo per stop, but photo_url can be NULL for signature-only records

---

#### `messages` (Dispatcher ↔ Driver Communication)
```sql
CREATE TABLE messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatcher_id BIGINT NOT NULL,  -- FK → users
  assignment_id BIGINT NULL,  -- FK → driver_assignments
  
  content TEXT NOT NULL,
  type ENUM('instruction', 'alert', 'note') DEFAULT 'instruction',
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP NULL,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
FOREIGN KEY (dispatcher_id) REFERENCES users(id) ON DELETE CASCADE;
FOREIGN KEY (assignment_id) REFERENCES driver_assignments(id) ON DELETE CASCADE;
CREATE INDEX idx_messages_assignment_read ON messages(assignment_id, is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

---

#### `message_notifications` (Push Delivery Tracking)
```sql
CREATE TABLE message_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  driver_id BIGINT NOT NULL,  -- FK → users
  message_id BIGINT NULL,  -- FK → messages
  
  queued_locally BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP NULL,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;
CREATE INDEX idx_notifications_driver_delivered ON message_notifications(driver_id, delivered_at);
```

---

#### `optimization_histories` (Solver Audit Log)
```sql
CREATE TABLE optimization_histories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,  -- FK → users
  
  instance VARCHAR(255) NOT NULL,  -- instance key (e.g., 'rioclaro', 'london_100')
  k INT NOT NULL,  -- number of vehicles requested
  algorithm VARCHAR(255) NOT NULL,  -- algorithm name
  
  -- Results
  num_routes INT NOT NULL,
  total_distance FLOAT NULL,
  distance_std FLOAT NULL,  -- standard deviation of route distances
  elapsed FLOAT NULL,  -- seconds
  valid BOOLEAN NOT NULL,  -- solution is valid/feasible
  issues TEXT NULL,  -- JSON array of validation issues if !valid
  result JSON NULL,  -- full solution payload (routes, nodes, summary, bbox, etc.)
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_histories_user_created ON optimization_histories(user_id, created_at);
```

---

#### `app_settings` (Application Configuration)
```sql
CREATE TABLE app_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Seeded keys
INSERT INTO app_settings (key, value) VALUES
  ('test_driver_quick_login', 'false'),
  ('mobile_theme_key', 'vectora');
```

---

### Infrastructure & Package Tables

#### `password_reset_tokens` (Fortify)
Larvel's built-in password reset flow

#### `sessions` (Laravel Session Storage)
Authenticated session cookies

#### `cache` & `cache_locks` (Application Cache)
Redis/database cache backend

#### `jobs` & `job_batches` & `failed_jobs` (Queue System)
Laravel queue infrastructure for async work

#### `personal_access_tokens` (Sanctum)
API authentication tokens for drivers (used by Flutter app)

#### `roles` & `permissions` & `model_has_roles` & `model_has_permissions` & `role_has_permissions` (Spatie Permission)
Role-based access control framework

#### `webauthn_credentials` (Laragear WebAuthn)
Fingerprint/passkey credential storage for optional 2FA

---

## Core Data Models

### User Model
```php
class User extends Authenticatable implements WebAuthnAuthenticatable {
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles, HasApiTokens, WebAuthnAuthentication;
    
    protected $fillable = ['name', 'email', 'password', 'last_seen_at', 'fcm_token'];
    protected $hidden = ['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'];
    
    public function isOnline(): bool {
        return $this->last_seen_at?->diffInMinutes(now()) <= 5;
    }
}
```

### DriverAssignment Model
```php
class DriverAssignment extends Model {
    protected $fillable = [
        'driver_id', 'instance', 'algorithm', 'vehicle_index', 'color',
        'total_distance', 'num_stops', 'stops', 'stop_statuses', 'geometry',
        'status', 'assigned_at', 'accepted_at', 'completed_at',
    ];
    
    protected $casts = [
        'stops' => 'array',
        'stop_statuses' => 'array',
        'geometry' => 'array',
        'assigned_at' => 'datetime',
        'accepted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
    
    public function driver(): BelongsTo { /* FK to User */ }
    public function photos(): HasMany { /* FK to DeliveryPhoto */ }
    public function locations(): HasMany { /* FK to DriverLocation */ }
    public function latestLocation(): HasOne { /* Latest GPS by recorded_at */ }
}
```

### Key Query Patterns
- **Active assignments:** `DriverAssignment::whereIn('status', ['pending', 'accepted', 'in_progress'])`
- **Completed today:** `DriverAssignment::where('status', 'completed')->whereDate('completed_at', today())`
- **Failed stops:** `stop_statuses[$index]['status'] === 'failed'`
- **Route lookup:** `DriverAssignment::where('instance', $dispatchRouteName)`

---

## User Journeys & Pipelines

### A. Dispatcher Journey

#### 1. **Authentication & Landing**
- **Route:** `/` (welcome page) → Fortify login form
- **Actions:**
  - Enter email/password
  - Optional 2FA (TOTP or WebAuthn fingerprint)
  - Verify email if required
- **Post-auth destination:** `/dashboard`

---

#### 2. **Dashboard / Overview**
- **Route:** `GET /dashboard` → [DashboardController::__invoke()](app/Http/Controllers/DashboardController.php)
- **Page:** [resources/js/pages/dashboard.tsx](resources/js/pages/dashboard.tsx)
- **Data fetched:**
  - **Stats:** active routes, online drivers, avg stops, total distance today
  - **Active routes:** 6 recent assignments with driver/vehicle/distance/stops
  - **Fleet health:** each driver's current status (idle/pending/in_progress/completed)
  - **Recent activity:** last 6 assignment updates
  - **Chart series:** 14-day completed routes & distance
  - **Live locations:** GPS pings, online status, estimated next stop
  - **Live map:** Mapbox GL with driver markers, heading, speed
- **Interactions:**
  - View live fleet on map
  - Click driver to center map, open details
  - Message a driver (trigger push notification)
  - Poll `/dashboard/live-locations` every 10–15s for map updates
- **Next:** Operations, Optimize, Routes, Fleet, Analytics, etc.

---

#### 3. **Optimize / Route Solver**
- **Route:** `GET /optimize` → [OptimizeController::show()](app/Http/Controllers/OptimizeController.php)
- **Page:** [resources/js/pages/optimize/index.tsx](resources/js/pages/optimize/index.tsx)
- **Workflow:**
  1. **Select instance** (built-in or imported):
     - Rio Claro Post (50, 100, 200, 500, 1000 stops)
     - Jordan (100, 250, 500 stops)
     - US cities (NYC, Chicago, 50–500 stops)
     - UK & Germany cities (London, Berlin, Munich, 50–500 stops)
     - Custom imported instances
  2. **Set vehicle count (k):**
     - Min 2, max 100
     - Recommended defaults: 50 stops → 15 vehicles, 100 stops → 30 vehicles
  3. **Pick algorithm** (grouped by family):
     - **Construction:** Nearest neighbor, Sweep, Clarke–Wright (parallel/sequential), Insertion variants ± 2-opt
     - **Metaheuristics:** Simulated annealing, Tabu search, ILS, Genetic algorithm
     - **OR-Tools:** GLS, SA, Tabu, PCA, Savings, Christofides, Parallel cheapest
     - **Quantum:** Recursive QAOA ± 2-opt (Qiskit + AerSimulator at leaves)
  4. **Run solver:**
     - `POST /optimize/solve` → spawns detached Python process (`nohup python3 scripts/run_vrp.py`)
     - Returns `job_id`, stores `.in.json` at `storage/app/vrp/jobs/{jobId}.in.json`
     - Python deletes `.in.json` on completion (signals completion to polling UI)
  5. **Poll job status:**
     - `GET /optimize/solve/{jobId}` → checks for `.out.json`
     - Returns `status: pending|done|failed` + progress + debug output
     - On completion, PHP creates `OptimizationHistory` record and caches result
  6. **View result:**
     - Mapbox GL with route visualization (nodes, edges, vehicle colors)
     - Summary: routes, total distance, distance std dev, weighted fairness, elapsed time
     - Per-vehicle breakdown: vehicle index, color, distance, stops, raw distance, snapped distance
  7. **Optional: Assign to drivers**
     - Modal: assign each vehicle to a driver (greedy bin-packing UI or manual)
     - `POST /optimize/dispatch` → creates one `DriverAssignment` per vehicle
     - Updates each driver's UI with new pending assignment
- **Caching:** cache key = `sha1({ algorithm, instance, k })` → `storage/app/vrp/cache/{hash}.json`
- **Advanced modes:**
  - **Race mode:** run 10+ algorithms side-by-side, compare results
  - **Pre-cache mode:** run all algorithms on instance, seed cache
  - **Import instance:** upload GeoJSON/KML/GPX, set depot, store to `scripts/instances/{name}.json`
  - **Debug output:** view solver stderr/stdout from modal

---

#### 4. **Operations / Live Control Room**
- **Route:** `GET /operations` → [OperationsController::show()](app/Http/Controllers/OperationsController.php)
- **Page:** [resources/js/pages/operations/index.tsx](resources/js/pages/operations/index.tsx)
- **Display:**
  - **Map:** live vehicle markers with heading arrows, stuck detection (red pulse if no heartbeat ≥20 min)
  - **Assignment list:** vehicles sorted by assigned_at desc
    - Progress bar: `stops_done / stops_total`
    - ETA: estimated minutes remaining (based on remaining stops + avg speed)
    - Status: pending/accepted/in_progress/completed
    - Stuck flag, online status, speed, heading
  - **Summary:** active routes, completed today, stuck count, failed stops today, drivers online
- **Interactions:**
  - Click marker or list item → fly map to vehicle, show details
  - Hover failed stop → show reason
  - **Requeue failed stop:**
    - Select a failed stop + pick a driver
    - `POST /operations/requeue` → create mini-assignment (depot → failed stop → depot)
    - Original stop marked as `requeued_to: {new_assignment_id}`
- **Polling:** `GET /operations/live` every 5s for updated assignment list + summary

---

#### 5. **Routes / Dispatch Route Management**
- **Route:** `GET /routes` → [DispatchRouteController::index()](app/Http/Controllers/DispatchRouteController.php)
- **Page:** [resources/js/pages/Routes/Index.tsx](resources/js/pages/Routes/Index.tsx)
- **Display:**
  - Paginated list of `DispatchRoute` records
  - Tabs: pending, in_progress, completed
  - Per-route card: name, status, assignments count, total stops, total distance, algorithm, drivers
  - Expandable driver list: vehicle index, driver name, color, stops, distance, status
- **Filters:** status, name search, algorithm, driver, date range, sort by created_at/updated_at
- **Actions:**
  - Click route → detail page
  - Create route (manual)
  - Edit route metadata
  - Delete route

---

#### 6. **Route Detail / Stop-Level Dispatch**
- **Route:** `GET /routes/{id}` → [DispatchRouteController::show()](app/Http/Controllers/DispatchRouteController.php)
- **Page:** [resources/js/pages/Routes/Show.tsx](resources/js/pages/Routes/Show.tsx)
- **Left sidebar:**
  - Route info: name, status, dispatch time
  - Totals: drivers, stops (completed/total), distance, photo/signature count
  - Driver list: clickable cards showing vehicle, progress %, status
- **Right panel (expandable):**
  - **Stops for selected driver:**
    - Stop index, recipient name/phone, address, status (pending/completed/failed), notes
    - Timestamp of completion
    - Any photo or signature for that stop (carousel)
  - **Delivery proofs:**
    - Photos: thumbnail carousel, click to expand with geo-verification badge
    - Signatures: inline preview, click to expand
  - **Stop status history:** all status changes for this assignment
- **Interactions:**
  - Click stop → highlight on map (if driver has geometry/snapped coordinates)
  - Click photo → modal with full image, geo badge, accuracy info
  - Click signature → modal with full sig

---

#### 7. **Fleet / Driver Roster**
- **Route:** `GET /fleet` → [FleetController::__invoke()](app/Http/Controllers/FleetController.php)
- **Page:** [resources/js/pages/fleet/index.tsx](resources/js/pages/fleet/index.tsx)
- **Display:**
  - Each driver row: name, email, joined date, current status (idle/pending/in_progress/completed)
  - Current assignment: vehicle label, instance, algorithm, color, distance, stops, status, time assigned
  - Stats: total routes, completed routes, total distance, total stops, completion rate %
  - History: 5 recent assignments with thumbnail cards
- **Summary:** total drivers, active drivers, idle drivers
- **Actions:** click driver → no drill-down (informational page)

---

#### 8. **Analytics**
- **Route:** `GET /analytics` → [AnalyticsController::__invoke()](app/Http/Controllers/AnalyticsController.php)
- **Page:** [resources/js/pages/analytics/index.tsx](resources/js/pages/analytics/index.tsx)
- **Charts & tables:**
  - **30-day series:** daily completed routes & cumulative distance
  - **Driver leaderboard:** top drivers by routes completed, distance, stops, completion rate %
  - **Algorithm performance:** average distance/stops per algorithm, count of runs
  - **Totals:** all-time completed routes, distance, stops, drivers
- **Interactions:** click to filter (future state)

---

#### 9. **Delivery Proofs Gallery**
- **Route:** `GET /delivery-proofs` → [DispatchRouteController@getAllDeliveryProofs()](app/Http/Controllers/DriverAssignmentController.php)
- **Page:** [resources/js/pages/DeliveryProofs.tsx](resources/js/pages/DeliveryProofs.tsx)
- **Display:**
  - Paginated gallery of photos (signatures shown inline if attached to same delivery record)
  - Per photo: driver name, vehicle, stop index, timestamp, notes, location verification badge
  - Geo-verification: ✅ verified (≤50m), ❌ unverified, ? no location data
- **Filters:** driver, date range
- **Interactions:** click photo → full-screen expand

---

#### 10. **People & Settings**
- **Users:**
  - **Route:** `GET /users` → [UserController::index()](app/Http/Controllers/UserController.php)
  - **Actions:** create user, edit user, delete user, assign roles (dispatcher/driver)
- **Settings:**
  - **Profile:** edit name, email, password
  - **Security:** 2FA setup (TOTP/WebAuthn)
  - **Developer:** toggle test driver quick login
  - **Mobile theme:** pick theme for Flutter app (Vectora, Midnight Noir, Cyberpunk Neon)

---

### B. Driver Journey (Mobile App / API)

#### 1. **Authentication**
- **Login:** `POST /api/driver/login` → email + password → returns Sanctum token
- **Token refresh:** `POST /api/driver/refresh-token` → returns new token
- **Logout:** `POST /api/driver/logout`

---

#### 2. **Dashboard / Assignment List**
- **Fetch:** `GET /api/driver/assignments` → list of pending/accepted/in_progress assignments
- **Display:**
  - Card per assignment: vehicle label, instance, num stops, total distance, color
  - Status badge: pending/accepted/in_progress
  - "Accept" button (if pending)

---

#### 3. **Accept Assignment**
- **Action:** `POST /api/driver/assignments/{id}/status` with `status: accepted`
- **Result:** assignment moves to accepted state, accepted_at timestamp set
- **UI:** Route appears as active in app's "Active Routes" view

---

#### 4. **Route Navigation & Stop Recording**
- **Fetch single assignment:** `GET /api/driver/assignments/{id}`
- **Record location:** `POST /api/driver/assignments/{id}/location` (lat, lng, accuracy, speed, heading, timestamp)
- **Record stop outcome:** `POST /api/driver/assignments/{id}/stops/{stopIndex}` with `status: completed|failed`, notes, failure_reason
- **Post-stop:**
  - If all non-depot stops recorded → assignment auto-transitions to completed state
  - Otherwise → assignment remains in_progress

---

#### 5. **Upload Proof of Delivery**
- **Photo + notes:**
  - `POST /api/driver/assignments/{id}/stops/{stopIndex}/photos`
  - Multipart: photo file, notes, photo_lat, photo_lng, photo_taken_at
  - Returns photo ID, URL, location verification result
- **Signature:**
  - `POST /api/driver/assignments/{id}/stops/{stopIndex}/signature`
  - Multipart: signature PNG file
  - Updates or creates delivery record with signature_url
- **Files stored:**
  - Photos: `/storage/delivery-photos/{assignmentId}/{stopIndex}/{timestamp}.jpg`
  - Signatures: `/storage/signatures/{assignmentId}/{stopIndex}/{timestamp}.png`

---

#### 6. **Driver Statistics & History**
- **Statistics:** `GET /api/driver/statistics?from=...&to=...`
  - Routes, stops, distance, completion rate, on-time rate, avg route time
- **Delivery history:** `GET /api/driver/delivery-history?limit=50&offset=0&date=...`
  - Completed assignments, stops delivered/failed, distance

---

#### 7. **Messages & Notifications**
- **Fetch messages:** `GET /api/driver/messages` (unread + recent)
- **Mark as read:** `POST /api/driver/messages/{id}/read`
- **Push notifications:** FCM token registered via `POST /api/driver/register-device`
- **Dispatcher sends message:** `POST /assignments/{id}/message` → triggers push to driver

---

#### 8. **Heartbeat**
- **Periodic heartbeat:** `POST /api/driver/heartbeat` to keep last_seen_at fresh
- **Purpose:** dispatcher uses this to detect offline/stuck drivers

---

## Route Optimization Flow

### **Step 1: Input Composition**
```json
{
  "instance": "rioclaro",
  "k": 7,
  "algorithm": "tabu_search",
  "force": false
}
```

### **Step 2: Solver Invocation**
- **Endpoint:** `POST /optimize/solve`
- **Backend action:**
  1. Check cache: `sha1({algorithm, instance, k})` → if exists & force=false, return cached result
  2. Write `.in.json` to `storage/app/vrp/jobs/{jobId}.in.json`
  3. Spawn detached process: `nohup python3 scripts/run_vrp.py < .in.json > .out.json 2> .err`
  4. Return `{ok: true, job_id: "..."}`

### **Step 3: Solver Execution (Python)**
- **File:** `scripts/run_vrp.py` → `scripts/vrp_optimizer.py`
- **Algorithm selection:**
  - **Construction heuristics:** nearest neighbor, sweep, savings, insertion
  - **Metaheuristics:** simulated annealing, tabu search, genetic
  - **OR-Tools:** if ortools installed, use native OR-Tools (otherwise fall back to savings)
  - **Quantum/Recursive:** QAOA at leaves (≤5 nodes), classical heuristics otherwise
- **Key steps:**
  1. Load instance (nodes, depot, distance matrix)
  2. Cluster/partition geographic nodes (if recursive mode)
  3. Solve leaf sub-problems (TSP per vehicle or cluster)
  4. If QAOA enabled: convert TSP to QUBO, solve via AerSimulator (max ~5 nodes)
  5. Apply 2-opt local search (if enabled)
  6. Snap nodes to OSM street graph (if osmnx available)
  7. Compute route geometry (GeoJSON LineString)
  8. Validate solution (feasibility, distance, fairness)
  9. Write `.out.json`
  10. Delete `.in.json` (signals completion)

### **Step 4: Result Polling**
- **Endpoint:** `GET /optimize/solve/{jobId}`
- **Backend checks:**
  - `.out.json` exists? → parse and return `{ok: true, status: 'done', result: {...}}`
  - `.in.json` missing + `.out.json` missing? → process completed (check .err for failure)
  - Otherwise → `{ok: true, status: 'pending', progress: "..."}`

### **Step 5: Result Caching & Audit**
- **On completion:**
  1. Parse result JSON
  2. Create `OptimizationHistory` record
  3. Cache result at `storage/app/vrp/cache/{hash}.json` for future reuse
  4. Return to UI with full solution

### **Step 6: Dispatch**
- **Endpoint:** `POST /optimize/dispatch`
- **Payload:** algorithm, instance, k, routes (per-vehicle: driver_id, stops, color, distance, geometry, num_stops)
- **Actions:**
  1. Create one `DriverAssignment` per vehicle
  2. Set status=pending, assigned_at=now()
  3. Create/update corresponding `DispatchRoute` record
- **Result:** assignments appear in drivers' mobile apps + operations page

---

## Driver Assignment Lifecycle

```
pending
  ↓ [Driver accepts in mobile app]
accepted
  ↓ [Driver posts first location or status update]
in_progress
  ├─→ [All non-depot stops recorded as completed/failed]
  │     ↓
  │   completed
  │     (or partial failure → can requeue failed stops)
  │
  └─→ [Timeout / manual cancellation]
      ↓
    cancelled
```

### **State Transitions**
- **pending → accepted:** `POST /api/driver/assignments/{id}/status` with `status: accepted`
- **pending/accepted → in_progress:** auto-advance on first stop record
- **in_progress → completed:** auto-advance when all non-depot stops have status recorded
- **any → cancelled:** manual cancellation (dispatcher or driver)

### **Stop Status Tracking**
Each element in `stop_statuses` array:
```json
{
  "status": "completed|failed|requeued",
  "notes": "...",
  "failure_reason": "no_answer|wrong_address|refused|damaged|other",
  "recorded_at": "2026-05-01T14:32:00Z",
  "requeued_to": 123  // if requeued
}
```

---

## Authentication & Authorization

### **Web (Dispatcher)**
- **Framework:** Laravel Fortify + WebAuthn (Laragear)
- **Credentials:** email + password
- **2FA:** TOTP (Google Authenticator) or WebAuthn (fingerprint/passkey)
- **Session:** Laravel session cookie
- **Authorization:** Spatie Permission roles
  - `dispatcher` role: can view/create/edit routes, send messages, manage fleet
  - `admin` role (implied): all permissions
  - Policy gates: `can:view routes`, `can:create routes`, `can:edit routes`, `can:delete routes`, `can:view users`, `can:create users`, etc.

### **Mobile (Driver)**
- **Framework:** Laravel Sanctum tokens
- **Login:** `POST /api/driver/login` (email + password) → returns `{token: "...", expires_in: 604800}`
- **Auth header:** `Authorization: Bearer {token}`
- **Routes:** `Route::middleware(['auth:sanctum'])` on `/api/driver/*` endpoints
- **Device registration:** `POST /api/driver/register-device` stores FCM token
- **Token refresh:** `POST /api/driver/refresh-token` for sliding expiry

---

## API Surface

### **Web (Inertia / Internal)**
- **Routes:** [routes/web.php](routes/web.php)
- **Auth:** Fortify login/register/reset
- **Dashboards:** `/` (welcome), `/dashboard`, `/operations`, `/optimize`, `/routes`, `/fleet`, `/analytics`, `/delivery-proofs`
- **Settings:** `/settings/profile`, `/settings/security`, `/settings/developer`, `/settings/mobile-theme`, `/settings/appearance`
- **Users:** `/users`, `/users/{id}/edit`, `/users/create`
- **Routes:** `/routes`, `/routes/{id}`, `/routes/create`, `/routes/{id}/edit`

### **Mobile (Sanctum API)**
- **Public (no auth):**
  - `POST /api/driver/login`
  - `POST /api/driver/refresh-token`
  - `GET /api/driver/public-config`
- **Protected (auth:sanctum):**
  - `GET /api/driver/profile`, `POST /api/driver/logout`
  - `POST /api/driver/heartbeat`
  - `POST /api/driver/register-device`
  - `GET /api/driver/assignments` (list), `GET /api/driver/assignments/{id}` (detail)
  - `POST /api/driver/assignments/{id}/status` (update status)
  - `POST /api/driver/assignments/{id}/location` (record GPS)
  - `POST /api/driver/assignments/{id}/stops/{stopIndex}` (record stop outcome)
  - `POST /api/driver/assignments/{id}/stops/{stopIndex}/photos` (upload photo)
  - `POST /api/driver/assignments/{id}/stops/{stopIndex}/signature` (upload signature)
  - `GET /api/driver/assignments/{id}/photos`
  - `GET /api/driver/statistics`, `GET /api/driver/delivery-history`
  - `GET /api/driver/delivery-proofs`
  - `GET /api/driver/messages`, `POST /api/driver/messages/{id}/read`
  - `GET /api/driver/config`, `GET /api/driver/diagnostic`

### **Dispatcher Webhooks (Future)**
- `/api/dispatch/message` (receive messages from driver)
- `/api/dispatch/stop-update` (receive stop status changes)
- May be used by external systems (dispatch board, ERP integration, etc.)

---

## Key Operations

### **Optimization Algorithms Registered**

#### **Construction Heuristics**
- Nearest neighbor (greedy), sweep, Clarke–Wright (parallel/sequential), insertion variants (nearest/farthest/cheapest)
- Optional 2-opt local search

#### **Metaheuristics**
- Simulated annealing, tabu search, iterated local search, genetic algorithm
- Parameter tuning: temperature, tabu tenure, population size, mutation rate

#### **OR-Tools**
- Requires `ortools` package
- Strategies: GLS, SA, Tabu, PCA, Savings, Christofides, Parallel cheapest
- Falls back to Savings algorithm if ortools unavailable

#### **Quantum (QAOA)**
- Requires `qiskit`, `qiskit-aer`, `qiskit-algorithms`, `qiskit-optimization`
- Recursive clustering + QAOA at leaf nodes (≤5 nodes)
- AerSimulator backend (no real quantum hardware)
- Falls back to classical brute-force if QAOA fails

### **Validation & Fairness**

**Weighted Fairness Metric:**
$$W_{\text{Fair}} = \frac{1}{2} \left( \frac{\text{total_distance}}{k} + \sigma_{\text{distance}} \right)$$

where:
- $k$ = number of vehicles
- $\sigma_{\text{distance}}$ = standard deviation of per-vehicle distances
- Lower is better (balanced load)

**Validation Checks:**
- All nodes visited exactly once (except depot multi-visit)
- Total distance reasonable
- No infeasible assignments

### **Location Snapping & Routing**

**Street Snapping (OSMnx):**
1. Fetch OSM road graph for instance bounding box
2. Per node: snap to nearest street edge
3. Cache graph at `storage/app/vrp/graph-{instance}.graphml`

**Route Geometry (GeoJSON):**
- Compute shortest path via road graph between consecutive snapped nodes
- Store as `[[lng, lat], [lng, lat], ...]` (GeoJSON order)
- Dispatchers see street-aligned routes on map (not straight lines)

### **Cache Strategy**

**Multi-level caching:**
1. **In-memory (browser):** `localStorage['vrp:{instance}:{k}:{algorithm}']` on frontend
2. **Database cache:** `storage/app/vrp/cache/{hash}.json` (shared across users, 1 week TTL)
3. **Instance graph:** `storage/app/vrp/graph-{instance}.graphml` (OSMnx, cached per instance)

**Cache invalidation:**
- Manual: pass `force: true` in solve request
- Automatic: solver deletes `.in.json` (signals recompute needed)

---

## Summary: Key Metrics & Capabilities

| Metric | Value |
|--------|-------|
| Max vehicles per optimization | 100 |
| Max nodes per instance | 2000 |
| Supported algorithms | 30+ |
| Solver modes | Single, race, pre-cache, custom import |
| VRP variant | CVRP (capacitated), distance minimization + fairness |
| Precision | Distance std dev, weighted fairness, location verification |
| Proof of delivery | Photo + notes, signature, geo-verification (Haversine) |
| Communication | Dispatcher → driver messaging, push notifications (FCM) |
| Live tracking | GPS streaming, online/offline detection, stuck detection |
| Mobile auth | Sanctum tokens, device registration, token refresh |
| Web auth | Fortify + 2FA (TOTP/WebAuthn) |
| RBAC | Spatie Permission (dispatcher/driver roles) |

---

## Appendix: Running the System

### **Development**
```bash
composer run dev  # Starts Laravel, Vite, queue, Pail all-in-one
# or
php artisan serve          # Laravel backend (localhost:8000)
pnpm dev                   # Vite frontend (localhost:5173)
```

### **Testing**
```bash
./vendor/bin/pest                  # All tests
./vendor/bin/pest tests/Feature/*  # Feature tests only
pnpm test                          # JS tests (if configured)
```

### **Linting & Type Checking**
```bash
composer run lint     # PHP pint (auto-fix)
pnpm lint            # ESLint (auto-fix)
pnpm format          # Prettier (auto-fix)
pnpm types:check     # TypeScript type check
```

### **Python Optimizer**
```bash
cd scripts
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 run_vrp.py < /path/to/input.json > /path/to/output.json
```

### **Database**
```bash
php artisan migrate:fresh --seed  # Full reset + seed data
php artisan migrate               # Incremental migrate
```

---

**Report Generated:** May 1, 2026  
**System Version:** VRPFR v1.0  
**Document Purpose:** Complete system architecture & operations reference
