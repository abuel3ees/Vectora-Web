# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

VRPFR is a fleet routing and dispatch platform. The web app (this repo) is a **Laravel 13 + Inertia.js + React 19 + TypeScript** monolith. A companion Flutter mobile app lives in the sibling directory `../vrpfrmob` and is consumed by drivers in the field.

## Commands

### Start Full Dev Environment

```bash
composer run dev
```

Starts Laravel (`php artisan serve`), queue worker, Pail log viewer, and Vite via `concurrently` in one terminal.

### Individual Services

```bash
php artisan serve        # Laravel backend only (localhost:8000)
pnpm dev                 # Vite/React frontend only (localhost:5173)
```

### Testing

```bash
./vendor/bin/pest                                    # all PHP tests
./vendor/bin/pest tests/Feature/SomeTest.php         # single test file
./vendor/bin/pest --filter="test name"               # single test by name
```

Tests run against an in-memory SQLite database (configured in `phpunit.xml`).

### Linting & Type Checking

```bash
composer run lint         # PHP: pint (auto-fix)
composer run lint:check   # PHP: pint (check only, no changes)
pnpm lint                 # JS/TS: ESLint (auto-fix)
pnpm lint:check           # JS/TS: ESLint (check only)
pnpm format               # Prettier (auto-fix)
pnpm format:check         # Prettier (check only)
pnpm types:check          # TypeScript (no emit)
```

### Database

```bash
php artisan migrate:fresh --seed    # full reset with seed data
php artisan migrate --seed          # incremental migrate + seed
```

### Python Optimization Engine

```bash
cd scripts
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 run_vrp.py          # manual test run (reads JSON from stdin)
```

Set `PYTHON_BIN` in `.env` to override which Python binary Laravel uses when spawning the optimizer (default: `python3`).

## Architecture

### Request Flow (Web UI)

Inertia.js bridges Laravel and React. Controllers call `Inertia::render('page/Name', [...props])`, and the React page component receives those props directly. No separate API layer for web pages — data flows through Inertia.

### Request Flow (Flutter Mobile App)

The Flutter app hits `/api/driver/*` routes authenticated via **Sanctum tokens** (not session/cookie). These routes are in `routes/web.php` with `withoutMiddleware('web')` to bypass CSRF. The public login endpoint at `/api/driver/login` returns a token; all other driver routes require `auth:sanctum`.

### Route Optimization Flow

1. **UI → `POST /optimize/solve`** — validates request, writes a `.in.json` file to `storage/app/vrp/jobs/`, then runs `scripts/run_vrp.py` as a detached `nohup` process (survives the HTTP request).
2. **UI polls `GET /optimize/solve/{jobId}`** — PHP checks for the `.out.json` output file. Absence of the `.in.json` file signals the job completed (Python deletes it on success).
3. **Python `run_vrp.py`** — reads instance data, calls `vrp_optimizer.solve()`, geocodes internal (x,y) coordinates into lat/lng using an affine mapping into the instance's bounding box, snaps nodes to the OSM street graph via OSMnx, and writes a GeoJSON result.
4. **On success** — PHP saves to `OptimizationHistory` and returns the result to the UI.
5. **UI → `POST /optimize/dispatch`** — creates one `DriverAssignment` row per vehicle in the solved plan.

Results are cached in `storage/app/vrp/cache/<hash>.json`. Pass `force: true` in the solve request to bypass the cache. The OSMnx road graph is cached in `storage/app/vrp/graph-<instance>.graphml`.

### Key Models

| Model | Purpose |
|---|---|
| `User` | Both dispatchers and drivers; roles managed via Spatie Permission (`role('driver')`) |
| `DispatchRoute` | Named route grouping — links to assignments by the `instance` string (not a FK) |
| `DriverAssignment` | One vehicle's assigned stops, stop statuses, GPS geometry, and lifecycle status |
| `OptimizationHistory` | Log of every completed optimization run (algorithm, distance, timing) |
| `DriverLocation` | GPS pings recorded by the mobile app during active assignments |
| `DeliveryPhoto` | Proof-of-delivery photos and signatures uploaded from the mobile app |
| `Message` | Dispatcher-to-driver messages tied to an assignment |

**Important:** `DispatchRoute.assignments()` is not a standard Eloquent relation — it queries `DriverAssignment` by `instance = this->name` (see `app/Models/DispatchRoute.php`).

### Python Optimizer Internals (`scripts/vrp_optimizer.py`)

`LEAF_SIZE = 4` controls the recursion threshold: sub-problems with ≤ 4 nodes go to brute-force or QAOA. QAOA requires Qiskit (`qiskit`, `qiskit-aer`, `qiskit-algorithms`, `qiskit-optimization`) and falls back to classical brute-force if those packages are absent. The OR-Tools algorithm similarly falls back to the savings algorithm if `ortools` is not installed.

Custom problem instances can be loaded by placing a JSON file at `scripts/instances/<key>.json` with fields: `depot`, `nodes`, `dist_matrix`, `bbox`, `label`.

### Frontend Stack

- **Radix UI** primitives + **Tailwind CSS v4** for all UI components (located in `resources/js/components/ui/`)
- **Mapbox GL** (`mapbox-gl`) for route map visualization; token passed from Laravel via Inertia props
- **Recharts** for analytics charts
- **Framer Motion** for animations
- **Sonner** for toasts
- **Laravel Wayfinder** generates typed route helpers — run `php artisan wayfinder:generate` after changing routes

### Design System

Dark-first palette using OKLCH color space. Key tokens (defined in `resources/css/`):
- Background: `oklch(0.13 0.02 250)` (deep navy)
- Primary/accent: `oklch(0.72 0.18 35)` (warm coral)
- Fonts: Geist (UI), Instrument Serif (display headings), JetBrains Mono (code)

See `FRONTEND_DESIGN_SYSTEM.md` for the complete token reference used when building the Flutter mobile app.

### Auth & Permissions

Laravel Fortify handles registration, login, and optional 2FA. Spatie Laravel Permission manages roles. The middleware group `['auth', 'verified']` gates all web routes. The `can:create,routes` policy gate is used on the messaging endpoint.
