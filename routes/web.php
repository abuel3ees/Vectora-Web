<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DispatchRouteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OptimizeController;
use App\Http\Controllers\DriverAssignmentController;
use App\Http\Controllers\FleetController;
use App\Http\Controllers\AnalyticsController;
use App\Models\DriverAssignment;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::inertia('presentation', 'presentation')->name('presentation');

    Route::resource('users', UserController::class);
    Route::resource('routes', DispatchRouteController::class);

    Route::get('fleet', FleetController::class)->name('fleet');
    Route::get('analytics', AnalyticsController::class)->name('analytics');

    Route::get('optimize', [OptimizeController::class, 'show'])->name('optimize');
    Route::post('optimize/solve', [OptimizeController::class, 'solve'])->name('optimize.solve');
    Route::get('optimize/solve/{jobId}', [OptimizeController::class, 'solveStatus'])->name('optimize.solve.status');
    Route::post('optimize/dispatch', [DriverAssignmentController::class, 'store'])->name('optimize.dispatch');
    Route::inertia('optimize/algorithm-walkthrough', 'optimize/AlgorithmWalkthrough')->name('optimize.walkthrough');
    Route::get('optimize/history', [OptimizeController::class, 'history'])->name('optimize.history');
});

// Driver-facing API — consumed by the Flutter app.
// Uses Sanctum tokens; falls back to session auth for web testing.

// Public auth endpoints (no authentication required, CSRF-exempt)
Route::prefix('api/driver')->withoutMiddleware('web')->group(function () {
    Route::post('login', [App\Http\Controllers\DriverAuthController::class, 'login']);
    Route::post('refresh-token', [App\Http\Controllers\DriverAuthController::class, 'refreshToken']);
});

// Protected driver endpoints (requires authentication, CSRF-exempt for API)
Route::middleware(['auth:sanctum'])->prefix('api/driver')->withoutMiddleware('web')->group(function () {
    Route::get('profile', [App\Http\Controllers\DriverAuthController::class, 'profile']);
    Route::post('logout', [App\Http\Controllers\DriverAuthController::class, 'logout']);

    // Assignments (routes)
    Route::get('assignments', [DriverAssignmentController::class, 'mine']);
    Route::get('assignments/{assignment}', [DriverAssignmentController::class, 'show'])->whereNumber('assignment');
    Route::post('assignments/{assignment}/status', [DriverAssignmentController::class, 'updateStatus'])->whereNumber('assignment');
    Route::post('assignments/{assignment}/stops/{stopIndex}', [DriverAssignmentController::class, 'recordStop'])
        ->whereNumber('assignment')
        ->whereNumber('stopIndex');

    // Diagnostic endpoint (debug only)
    Route::get('diagnostic', [DriverAssignmentController::class, 'diagnostic']);

    // App config (Mapbox token, feature flags, etc.)
    Route::get('config', [DriverAssignmentController::class, 'config']);
});

require __DIR__.'/settings.php';
