# VRPFR: Enterprise Vehicle Routing & Fleet Dispatch Platform

> **Advanced fleet optimization and route management system** combining quantum-inspired algorithms, real-time dispatch, and multi-platform applications for modern logistics operations.

<div align="center">

[![Laravel](https://img.shields.io/badge/Laravel-13.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Flutter](https://img.shields.io/badge/Flutter-3.0-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**[Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Contributing](#-contributing)**

</div>

---

## 📋 Overview

VRPFR is a cutting-edge **Vehicle Routing Problem Fleet Routing** platform that combines traditional optimization algorithms with quantum computing capabilities to solve complex logistics challenges at scale.

### What is the Vehicle Routing Problem (VRP)?

The VRP is a classic combinatorial optimization problem: given a fleet of vehicles and a set of delivery locations, find the most efficient routes that minimize distance, time, and cost while respecting constraints like vehicle capacity, driver hours, and service windows.

### Key Features

- 🚀 **Multi-Platform Support**: Web dashboard, mobile app, and backend APIs
- 🧮 **Advanced Route Optimization**: Classical heuristics + quantum algorithms (QAOA)
- 📍 **Real-Time Dispatch**: Live tracking, dynamic reoptimization, and route adjustments
- 📊 **Analytics & Insights**: Comprehensive performance metrics, KPI tracking, and reporting
- 🔐 **Enterprise-Grade Security**: Role-based access control, audit logs, and data encryption
- 🌐 **Scalable Architecture**: Microservices-ready with async job processing
- 📱 **Driver Mobile App**: Flutter-based mobile app for real-time updates and task management
- ⚡ **Weighted Fairness Metrics**: Balanced workload distribution across the fleet

---

## 🏗️ Architecture

### System Components

```
VRPFR Platform
├── Backend (Laravel 13)
│   ├── REST API (Sanctum-authenticated)
│   ├── Route Optimization Engine
│   ├── Real-time Dispatch System
│   └── Analytics & Reporting
│
├── Frontend (React + TypeScript)
│   ├── Admin Dashboard
│   ├── Fleet Management
│   ├── Route Visualization
│   └── Real-time Analytics
│
├── Mobile App (Flutter)
│   ├── Driver Task Management
│   ├── GPS Tracking
│   ├── Push Notifications
│   └── Offline Sync
│
└── Optimization Engine (Python)
    ├── Classical Algorithms (Tabu Search, Simulated Annealing)
    ├── Heuristics (Nearest Neighbor, Savings Algorithm)
    ├── QAOA Quantum Solver (Qiskit)
    └── Benchmarking Suite
```

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Laravel 13, PHP 8.3, SQLite/PostgreSQL |
| **Frontend Web** | React 19, TypeScript, Tailwind CSS, Inertia.js |
| **Mobile** | Flutter, Dart, Firebase (optional) |
| **Optimization** | Python 3.11+, Qiskit, NumPy, Scipy |
| **Real-time** | Laravel Broadcasting, WebSockets |
| **Authentication** | Laravel Sanctum, JWT (optional) |
| **Testing** | Pest (PHP), Jest (JS), Flutter Testing |
| **DevOps** | Docker, Docker Compose, GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites

- **PHP** 8.3+
- **Node.js** 20+ / **pnpm** 8+
- **SQLite** or **PostgreSQL**
- **Python** 3.11+ (for optimization engine)
- **Flutter** 3.0+ (for mobile development)

### Installation (5 minutes)

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/vrpfr.git
cd vrpfr
```

#### 2. Backend Setup

```bash
# Install PHP dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Initialize database
touch database/database.sqlite
php artisan migrate:fresh --seed

# Start development server
php artisan serve
```

Backend runs at: `http://localhost:8000`

#### 3. Frontend Setup

```bash
# Install Node dependencies
pnpm install

# Start Vite dev server
pnpm dev
```

Frontend accessible at: `http://localhost:5173`

#### 4. Optimization Engine (Optional)

```bash
cd scripts
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

# Run benchmark
python3 run_vrp.py
```

### Running All Services (Automated)

```bash
# Start all services with one command
./start-dev.sh
```

This opens 3 terminal tabs:
1. Laravel backend
2. React frontend  
3. Python optimization engine

---

## 📚 Project Structure

```
vrpfr/
├── app/
│   ├── Http/
│   │   ├── Controllers/         # API endpoints
│   │   ├── Requests/            # Form validation
│   │   └── Middleware/          # Auth & CORS
│   ├── Models/                  # Database models
│   ├── Actions/                 # Business logic
│   └── Providers/               # Service providers
│
├── resources/
│   ├── js/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Route pages (Inertia)
│   │   ├── layouts/             # Layout wrappers
│   │   └── types/               # TypeScript interfaces
│   ├── css/                     # Tailwind styles
│   └── views/                   # Blade templates (Inertia)
│
├── routes/
│   ├── web.php                  # Web routes
│   ├── api.php                  # API routes
│   └── console.php              # Artisan commands
│
├── database/
│   ├── migrations/              # Schema changes
│   ├── factories/               # Model factories
│   └── seeders/                 # Seed data
│
├── config/
│   ├── app.php                  # App configuration
│   ├── auth.php                 # Auth configuration
│   └── ...
│
├── scripts/                     # Python optimization
│   ├── vrp_optimizer.py         # Main optimization logic
│   ├── classical_vrp_benchmark.py # Benchmarking
│   └── requirements.txt
│
├── tests/
│   ├── Feature/                 # Feature tests
│   ├── Unit/                    # Unit tests
│   └── Pest.php                 # Test configuration
│
├── storage/                     # Logs, sessions, uploads
├── bootstrap/                   # Framework bootstrap
├── public/                      # Web root
├── vendor/                      # Composer packages
└── node_modules/                # NPM packages
```

---

## 🔧 API Reference

### Authentication

All API requests require Sanctum token authentication:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     http://localhost:8000/api/routes
```

### Key Endpoints

#### Routes Management
```
GET    /api/routes              # List all routes
POST   /api/routes              # Create new route
GET    /api/routes/{id}         # Get route details
PUT    /api/routes/{id}         # Update route
DELETE /api/routes/{id}         # Delete route
```

#### Fleet Management
```
GET    /api/fleet               # List vehicles
POST   /api/fleet               # Add vehicle
GET    /api/fleet/{id}          # Vehicle details
PUT    /api/fleet/{id}          # Update vehicle
DELETE /api/fleet/{id}          # Remove vehicle
```

#### Optimization
```
POST   /api/optimize            # Run optimization
GET    /api/optimize/{id}       # Get optimization result
GET    /api/benchmarks          # Optimization benchmarks
```

#### Analytics
```
GET    /api/analytics/dashboard # Dashboard metrics
GET    /api/analytics/routes    # Route statistics
GET    /api/analytics/fleet     # Fleet performance
```

### Response Format

All endpoints return JSON:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Route 001",
    "status": "pending",
    "total_distance": 45.2,
    "weighted_fairness": 5906.34
  },
  "message": "Operation successful"
}
```

---

## 🧮 Route Optimization Engine

### Algorithms Supported

#### Classical Algorithms
- **Nearest Neighbor**: Fast greedy approach
- **Savings Algorithm**: Build routes through savings
- **Simulated Annealing**: Probabilistic optimization
- **Tabu Search**: Memory-based local search
- **2-opt Heuristic**: Edge swap improvements

#### Quantum-Inspired
- **QAOA (Quantum Approximate Optimization Algorithm)**
  - Powered by Qiskit 2.2.3
  - Handles TSP subproblems at leaf nodes
  - Hybrid classical-quantum approach
  - Graceful fallback to classical when needed

### Weighted Fairness Metric

VRPFR implements a sophisticated fairness metric to ensure balanced workload distribution:

$$W_{Fair} = \frac{1}{2}\left(\frac{D_{total}}{k} + \sigma_d\right)$$

Where:
- $D_{total}$ = Total distance across all routes
- $k$ = Number of vehicles
- $\sigma_d$ = Standard deviation of distances per route

This balances **efficiency** (minimizing total distance) with **fairness** (ensuring no driver gets disproportionately burdened).

### Running Optimization

```python
from scripts.vrp_optimizer import VRPOptimizer

optimizer = VRPOptimizer()
result = optimizer.solve(
    locations=locations_list,
    num_vehicles=5,
    algorithm='recursive_qaoa'
)

print(f"Total Distance: {result.total_distance}")
print(f"Weighted Fairness: {result.weighted_fairness}")
```

---

## 🎨 Frontend Design System

### Color Palette (OKLCH)

| Name | OKLCH | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | `oklch(0.72 0.18 35)` | Warm Coral | CTAs, accents |
| **Background** | `oklch(0.13 0.02 250)` | #0f0f1a | Main background |
| **Card** | `oklch(0.16 0.02 250)` | Lighter Navy | Card surfaces |
| **Destructive** | `oklch(0.577 0.245 27.325)` | Red | Errors, warnings |

### Typography

- **Display**: Instrument Serif (headers)
- **UI**: Geist Sans (default)
- **Code**: JetBrains Mono (monospace)

### UI Components

All components are built with Radix UI primitives and Tailwind CSS:

```tsx
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'

export function MyComponent() {
  return (
    <Dialog>
      <Button variant="default">Open Dialog</Button>
    </Dialog>
  )
}
```

---

## 📱 Mobile App (Flutter)

The Flutter app provides drivers with:

- **Real-time Task Updates**: Live task notifications and status changes
- **GPS Tracking**: Track driver location throughout shift
- **Route Optimization**: View optimized route with turn-by-turn directions
- **Offline Support**: Work offline with automatic sync
- **Push Notifications**: Receive route updates and alerts

### Quick Start

```bash
# Setup Flutter (if not installed)
cd /path/to/flutter-sdk
export PATH="$PATH:$(pwd)/bin"

# Create/open project
flutter create vrpfr_mobile
cd vrpfr_mobile

# Configure backend
# Edit lib/config/constants.dart:
# static const String apiUrl = 'http://localhost:8000';

# Run on simulator/device
flutter run
```

---

## 🧪 Testing

### Backend (Pest PHP)

```bash
# Run all tests
./vendor/bin/pest

# Run specific test file
./vendor/bin/pest tests/Feature/RouteOptimizationTest.php

# Run with coverage
./vendor/bin/pest --coverage
```

### Frontend (Jest)

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Integration Tests

```bash
# Start all services
./start-dev.sh

# Run integration tests
./vendor/bin/pest tests/Integration/
pnpm test:integration
```

---

## 🚢 Deployment

### Docker Setup

```bash
# Build image
docker build -t vrpfr .

# Run container
docker run -p 8000:8000 vrpfr

# Or use Docker Compose
docker-compose up
```

### Production Checklist

- [ ] Set `APP_ENV=production`
- [ ] Generate `APP_KEY` securely
- [ ] Configure proper database (PostgreSQL recommended)
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for frontend domain
- [ ] Enable rate limiting
- [ ] Setup monitoring & logging
- [ ] Configure backup strategy
- [ ] Setup CI/CD pipeline

### Environment Variables

```env
APP_NAME=VRPFR
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://vrpfr.example.com

DB_CONNECTION=pgsql
DB_HOST=db.example.com
DB_DATABASE=vrpfr_prod
DB_USERNAME=app_user
DB_PASSWORD=secure_password

SANCTUM_STATEFUL_DOMAINS=vrpfr.example.com
SESSION_DOMAIN=vrpfr.example.com
CORS_ALLOWED_ORIGINS=https://vrpfr.example.com

QUEUE_CONNECTION=database
CACHE_STORE=redis

MAPBOX_PUBLIC_TOKEN=pk_...
```

---

## 📊 Performance Metrics

### Optimization Benchmark Results

| Algorithm | Nodes | Vehicles | Distance | Time (s) | Fairness |
|-----------|-------|----------|----------|----------|----------|
| Nearest Neighbor | 50 | 7 | 57,826 | 0.001 | 5,906 |
| Tabu Search | 50 | 7 | 39,489 | 2.340 | 12,311 |
| Simulated Annealing | 50 | 7 | 41,234 | 3.100 | 11,456 |
| Recursive QAOA | 50 | 7 | 38,902 | 45.200 | 12,089 |

*Benchmarks from Rio Claro Post instance with k=3 clusters*

---

## 🔒 Security

### Authentication & Authorization

- **Sanctum**: Token-based API authentication
- **Permissions**: Spatie Laravel Permission for role-based access
- **Two-Factor Authentication**: Optional 2FA via Fortify
- **CORS**: Configured for specific domains

### Best Practices

- All passwords hashed with bcrypt
- SQL injection prevention via Eloquent ORM
- CSRF protection on all state-changing endpoints
- Rate limiting on sensitive endpoints
- Audit logging for important operations

---

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Follow Code Standards**
   ```bash
   # Run linter/formatter
   pnpm lint:fix
   
   # PHP code quality
   ./vendor/bin/pint
   ```

3. **Write Tests**
   ```bash
   ./vendor/bin/pest tests/Feature/YourFeatureTest.php
   pnpm test src/components/__tests__/YourComponent.test.ts
   ```

4. **Commit with Clear Messages**
   ```bash
   git commit -m "feat: Add amazing new feature"
   ```

5. **Push & Create Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Standards

- **PHP**: PSR-12 via Laravel Pint
- **TypeScript**: ESLint + Prettier
- **Flutter**: Flutter standard formatting
- **Commits**: Conventional Commits format

### Issues & Discussions

- 🐛 **Bug Reports**: Use GitHub Issues with reproduction steps
- 💡 **Feature Requests**: Clearly describe use case and benefits
- 📚 **Documentation**: Contribute to docs/ folder
- 💬 **Discussions**: Ask questions in GitHub Discussions

---

## 📖 Documentation

- [Local Setup Guide](LOCAL_SETUP_GUIDE.md) - Detailed local development
- [Frontend Design System](FRONTEND_DESIGN_SYSTEM.md) - UI/UX guidelines
- [Mobile App Spec](MOBILE_APP_SPEC.md) - Flutter app specification
- [Project Analysis](PROJECT_ANALYSIS.md) - Code analysis & metrics

---

## 🆘 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Clear cache and reinstall
php artisan cache:clear
php artisan config:clear
composer install
php artisan migrate:fresh --seed
```

**Frontend build errors**
```bash
# Clear node modules and cache
rm -rf node_modules
pnpm install
pnpm build
```

**Database issues**
```bash
# Reset database
php artisan migrate:fresh
php artisan db:seed

# Check connection
php artisan tinker
>>> DB::connection()->getPdo()
```

**Optimization engine slow**
```bash
# Use classical algorithms for large instances
# QAOA limited to ≤5 nodes due to simulator constraints
# Run benchmarks to compare algorithms
python3 scripts/classical_vrp_benchmark.py
```

---

## 📞 Support & Contact

- 📧 **Email**: support@vrpfr.com
- 💬 **Discord**: [Join Community](https://discord.gg/vrpfr)
- 🐦 **Twitter**: [@VRPFROfficial](https://twitter.com/vrpfr)
- 📚 **Documentation**: [docs.vrpfr.com](https://docs.vrpfr.com)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Qiskit Community** for quantum computing framework
- **Laravel Team** for excellent framework
- **React Community** for frontend ecosystem
- **Flutter Team** for cross-platform mobile framework
- Contributors and maintainers

---

<div align="center">

**[Back to Top](#vrpfr-enterprise-vehicle-routing--fleet-dispatch-platform)**

Made with ❤️ by the VRPFR Team

</div>
