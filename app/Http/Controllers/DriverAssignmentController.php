<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
use App\Models\DeliveryPhoto;
use App\Models\DriverLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverAssignmentController extends Controller
{
    /**
     * Dispatch a solved VRP plan to a set of drivers.
     * Consumed by the web UI — creates one assignment per vehicle.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'instance'  => ['required', 'string'],
            'algorithm' => ['required', 'string'],
            'routes'              => ['required', 'array', 'min:1'],
            'routes.*.vehicle_index'  => ['required', 'integer'],
            'routes.*.driver_id'      => ['required', 'integer', 'exists:users,id'],
            'routes.*.color'          => ['nullable', 'string'],
            'routes.*.total_distance' => ['nullable', 'numeric'],
            'routes.*.num_stops'      => ['nullable', 'integer'],
            'routes.*.stops'          => ['required', 'array', 'min:1'],
            'routes.*.stops.*.node_id'  => ['required', 'integer'],
            'routes.*.stops.*.lat'      => ['required', 'numeric'],
            'routes.*.stops.*.lng'      => ['required', 'numeric'],
            'routes.*.stops.*.snapped_lat' => ['sometimes', 'numeric'],
            'routes.*.stops.*.snapped_lng' => ['sometimes', 'numeric'],
            'routes.*.stops.*.is_depot'    => ['sometimes', 'boolean'],
            // GeoJSON LineString coordinates [[lng,lat], ...] from OSMnx street snapping
            'routes.*.geometry'            => ['sometimes', 'nullable', 'array'],
            'routes.*.geometry.type'       => ['sometimes', 'string'],
            'routes.*.geometry.coordinates' => ['sometimes', 'array'],
        ]);

        $now = now();
        $created = [];
        foreach ($data['routes'] as $r) {
            $created[] = DriverAssignment::create([
                'driver_id'      => $r['driver_id'],
                'instance'       => $data['instance'],
                'algorithm'      => $data['algorithm'],
                'vehicle_index'  => $r['vehicle_index'],
                'color'          => $r['color'] ?? null,
                'total_distance' => $r['total_distance'] ?? null,
                'num_stops'      => $r['num_stops'] ?? count($r['stops']),
                'stops'          => $r['stops'],
                // Store GeoJSON coordinates array (may be null if OSMnx unavailable)
                'geometry'       => $r['geometry']['coordinates'] ?? null,
                'status'         => 'pending',
                'assigned_at'    => $now,
            ]);
        }

        // Ensure a DispatchRoute record exists so dispatched routes appear in the admin routes list
        $dispatchRoute = \App\Models\DispatchRoute::firstOrCreate(
            ['name' => $data['instance']],
            [
                'status'      => 'pending',
                'description' => "Algorithm: {$data['algorithm']} · " . count($created) . " vehicles",
            ]
        );

        return response()->json([
            'ok'          => true,
            'count'       => count($created),
            'assignments' => $created,
            'route_id'    => $dispatchRoute->id,
        ], 201);
    }

    /**
     * Driver-facing list — active assignments for the authenticated driver.
     */
    public function mine(Request $request): JsonResponse
    {
        $driver = $request->user();

        $rows = DriverAssignment::query()
            ->where('driver_id', $driver->id)
            ->whereIn('status', ['pending', 'accepted', 'in_progress'])
            ->orderByDesc('assigned_at')
            ->get(['id', 'instance', 'algorithm', 'vehicle_index', 'color',
                   'total_distance', 'num_stops', 'stops', 'stop_statuses',
                   'geometry', 'status', 'assigned_at', 'accepted_at', 'completed_at'])
            ->map(fn ($a) => $this->formatAssignment($a));

        return response()->json(['ok' => true, 'assignments' => $rows]);
    }

    /**
     * Single assignment detail — used by route detail screen.
     */
    public function show(Request $request, int $assignment): JsonResponse
    {
        $user = $request->user();
        $model = DriverAssignment::find($assignment);
        
        \Log::info('DriverAssignmentController.show', [
            'param_assignment' => $assignment,
            'found_model' => $model ? 'yes' : 'no',
            'model_id' => $model?->id,
            'model_driver_id' => $model?->driver_id,
            'authenticated_user_id' => $user->id,
            'authenticated_email' => $user->email,
        ]);
        
        if (!$model) {
            return response()->json(['error' => 'Assignment not found'], 404);
        }
        
        abort_unless($model->driver_id === $user->id, 403);

        return response()->json([
            'ok'         => true,
            'assignment' => $this->formatAssignment($model),
        ]);
    }

    /**
     * Record a delivery outcome for a single stop.
     *
     * POST body: { status: 'completed'|'failed', notes?: string }
     */
    public function recordStop(
        Request $request,
        int $assignment,
        int $stopIndex,
    ): JsonResponse {
        $model = DriverAssignment::find($assignment);
        abort_unless($model && $model->driver_id === $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['required', 'in:completed,failed'],
            'notes'  => ['nullable', 'string', 'max:1000'],
        ]);

        $statuses = $model->stop_statuses ?? [];
        $statuses[$stopIndex] = [
            'status'      => $data['status'],
            'notes'       => $data['notes'] ?? null,
            'recorded_at' => now()->toISOString(),
        ];
        $model->stop_statuses = $statuses;

        // Auto-advance assignment status
        $nonDepotStops = collect($model->stops)->filter(fn ($s) => ! ($s['is_depot'] ?? false));
        $recordedCount = count(array_filter($statuses, fn ($s) => isset($s['status'])));

        if ($recordedCount >= $nonDepotStops->count()) {
            $model->status       = 'completed';
            $model->completed_at = now();
        } elseif ($model->status === 'pending' || $model->status === 'accepted') {
            $model->status      = 'in_progress';
            $model->accepted_at = $model->accepted_at ?? now();
        }

        $model->save();

        return response()->json([
            'ok'         => true,
            'assignment' => $this->formatAssignment($model),
        ]);
    }

    /**
     * Update the overall assignment status.
     */
    public function updateStatus(Request $request, int $assignment): JsonResponse
    {
        $model = DriverAssignment::find($assignment);
        abort_unless($model && $model->driver_id === $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['required', 'in:accepted,in_progress,completed,cancelled'],
        ]);

        $model->status = $data['status'];
        if ($data['status'] === 'accepted' && ! $model->accepted_at) {
            $model->accepted_at = now();
        }
        if ($data['status'] === 'completed' && ! $model->completed_at) {
            $model->completed_at = now();
        }
        $model->save();

        return response()->json(['ok' => true, 'assignment' => $this->formatAssignment($model)]);
    }

    /**
     * App configuration — exposes non-secret config the mobile app needs
     * (Mapbox public token, feature flags, etc.).
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'config' => [
                'mapbox_token' => config('services.mapbox.token'),
            ],
        ]);
    }

    /**
     * Diagnostic endpoint — helps debug auth/data issues.
     * Shows what the current user can see.
     */
    public function diagnostic(Request $request): JsonResponse
    {
        $driver = $request->user();

        return response()->json([
            'ok' => true,
            'driver' => [
                'id' => $driver->id,
                'email' => $driver->email,
                'name' => $driver->name,
            ],
            'assignments_count' => DriverAssignment::where('driver_id', $driver->id)->count(),
            'active_assignments' => DriverAssignment::where('driver_id', $driver->id)
                ->whereIn('status', ['pending', 'accepted', 'in_progress'])
                ->pluck('id')
                ->toArray(),
            'all_assignments' => DriverAssignment::where('driver_id', $driver->id)
                ->pluck('id')
                ->toArray(),
        ]);
    }

    /**
     * Upload a delivery photo for a specific stop with location verification.
     *
     * POST body: { photo: File, notes?: string, photo_lat?: float, photo_lng?: float, photo_taken_at?: ISO8601 }
     */
    public function uploadPhoto(
        Request $request,
        int $assignment,
        int $stopIndex,
    ): JsonResponse {
        $model = DriverAssignment::find($assignment);
        abort_unless($model && $model->driver_id === $request->user()->id, 403);

        $data = $request->validate([
            'photo' => ['required', 'image', 'max:10240'], // 10MB max
            'notes' => ['nullable', 'string', 'max:500'],
            'photo_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'photo_lng' => ['nullable', 'numeric', 'between:-180,180'],
            'photo_taken_at' => ['nullable', 'date'],
        ]);

        // Get the stop information to verify location
        $stops = $model->stops;
        $stopInfo = null;
        if (is_array($stops)) {
            foreach ($stops as $stop) {
                if (($stop['raw_index'] ?? null) == $stopIndex) {
                    $stopInfo = $stop;
                    break;
                }
            }
        }

        $photoLat = $data['photo_lat'] ?? null;
        $photoLng = $data['photo_lng'] ?? null;
        $stopLat = $stopInfo['lat'] ?? null;
        $stopLng = $stopInfo['lng'] ?? null;
        $locationVerified = false;
        $distanceM = null;

        // Calculate distance and verify location if both positions provided
        if ($photoLat && $photoLng && $stopLat && $stopLng) {
            $distanceM = $this->calculateDistance($photoLat, $photoLng, $stopLat, $stopLng);
            // Consider verified if within 50 meters
            $locationVerified = $distanceM <= 50;
        }

        // Store the photo in storage/app/public/delivery-photos/{assignmentId}/{stopIndex}/{timestamp}.jpg
        $directory = "delivery-photos/{$assignment}/{$stopIndex}";
        $filename = now()->timestamp . '.' . $data['photo']->extension();
        $path = $data['photo']->storeAs($directory, $filename, 'public');
        $photoUrl = "/storage/{$path}";

        // Create the photo record with location data
        $photo = DeliveryPhoto::create([
            'driver_assignment_id' => $assignment,
            'stop_raw_index'       => $stopIndex,
            'photo_url'            => $photoUrl,
            'notes'                => $data['notes'] ?? null,
            'photo_lat'            => $photoLat,
            'photo_lng'            => $photoLng,
            'stop_lat'             => $stopLat,
            'stop_lng'             => $stopLng,
            'location_distance_m'  => $distanceM,
            'location_verified'    => $locationVerified,
            'photo_taken_at'       => $data['photo_taken_at'] ? \Carbon\Carbon::parse($data['photo_taken_at']) : now(),
            'uploaded_at'          => now(),
        ]);

        return response()->json([
            'ok'    => true,
            'photo' => [
                'id' => $photo->id,
                'stop_raw_index' => $photo->stop_raw_index,
                'photo_url' => $photo->photo_url,
                'notes' => $photo->notes,
                'location_verified' => $photo->location_verified,
                'location_distance_m' => $photo->location_distance_m,
                'photo_taken_at' => $photo->photo_taken_at,
                'uploaded_at' => $photo->uploaded_at,
            ],
        ], 201);
    }

    /**
     * Upload a customer signature for a delivery stop.
     *
     * POST body: { signature: File (PNG bytes) }
     */
    public function uploadSignature(
        Request $request,
        int $assignment,
        int $stopIndex,
    ): JsonResponse {
        $model = DriverAssignment::find($assignment);
        abort_unless($model && $model->driver_id === $request->user()->id, 403);

        $data = $request->validate([
            'signature' => ['required', 'file', 'mimes:png,jpg', 'max:5120'], // 5MB max for signature
        ]);

        // Store the signature in storage/app/public/signatures/{assignmentId}/{stopIndex}/{timestamp}.png
        $directory = "signatures/{$assignment}/{$stopIndex}";
        $filename = now()->timestamp . '.' . $data['signature']->extension();
        $path = $data['signature']->storeAs($directory, $filename, 'public');
        $signatureUrl = "/storage/{$path}";

        // Update the delivery_photo record with the signature URL for this stop
        // Find the most recent photo for this stop (or create one if none exists)
        $photo = DeliveryPhoto::where('driver_assignment_id', $assignment)
            ->where('stop_raw_index', $stopIndex)
            ->latest('uploaded_at')
            ->first();

        if ($photo) {
            // Update existing photo with signature
            $photo->update([
                'signature_url' => $signatureUrl,
                'signature_captured_at' => now(),
            ]);
        } else {
            // Create a new photo record for this stop (signature-only delivery)
            $photo = DeliveryPhoto::create([
                'driver_assignment_id' => $assignment,
                'stop_raw_index' => $stopIndex,
                'photo_url' => null,
                'signature_url' => $signatureUrl,
                'signature_captured_at' => now(),
                'uploaded_at' => now(),
            ]);
        }

        return response()->json([
            'ok' => true,
            'signature' => [
                'id' => $photo->id,
                'stop_raw_index' => $photo->stop_raw_index,
                'signature_url' => $photo->signature_url,
                'signature_captured_at' => $photo->signature_captured_at,
            ],
        ], 201);
    }

    /**
     * Get driver statistics for a given date range.
     * 
     * GET /api/driver/statistics?from=2026-01-01&to=2026-01-31
     */
    public function getStatistics(Request $request): JsonResponse
    {
        $driver = $request->user();
        $from = $request->query('from');
        $to = $request->query('to');

        // Parse dates or use defaults
        $fromDate = $from ? \Carbon\Carbon::parse($from)->startOfDay() : now()->subDays(30)->startOfDay();
        $toDate = $to ? \Carbon\Carbon::parse($to)->endOfDay() : now()->endOfDay();

        // Get all assignments for this driver in the date range
        $assignments = DriverAssignment::where('driver_id', $driver->id)
            ->whereBetween('assigned_at', [$fromDate, $toDate])
            ->get();

        $totalRoutes = $assignments->count();
        $completedAssignments = $assignments->where('status', 'completed')->count();

        // Calculate stops
        $totalStops = $assignments->sum(function ($a) {
            return collect($a->stops)->filter(fn ($s) => !($s['is_depot'] ?? false))->count();
        });

        $completedStops = 0;
        $failedStops = 0;
        foreach ($assignments as $assignment) {
            $stopStatuses = $assignment->stop_statuses ?? [];
            foreach ($stopStatuses as $status) {
                if ($status['status'] === 'completed') {
                    $completedStops++;
                } elseif ($status['status'] === 'failed') {
                    $failedStops++;
                }
            }
        }

        // Calculate total distance
        $totalDistance = $assignments->sum('total_distance') ?? 0;

        // Calculate average route time (rough estimate in minutes)
        $totalMinutes = 0;
        $routeCount = 0;
        foreach ($assignments as $a) {
            if ($a->accepted_at && $a->completed_at) {
                $minutes = $a->completed_at->diffInMinutes($a->accepted_at);
                $totalMinutes += $minutes;
                $routeCount++;
            }
        }
        $averageRouteTime = $routeCount > 0 ? round($totalMinutes / $routeCount) : 0;

        // Calculate on-time rate (assume 100% if no baseline)
        $onTimeRate = $completedStops > 0 ? round(($completedStops / ($completedStops + $failedStops)) * 100) : 100;

        // Placeholder for customer rating (would need review data)
        $customerRating = 4.5;

        return response()->json([
            'ok' => true,
            'data' => [
                'totalRoutes' => $totalRoutes,
                'totalStops' => $totalStops,
                'completedStops' => $completedStops,
                'failedStops' => $failedStops,
                'totalDistance' => round($totalDistance, 2),
                'averageRouteTime' => $averageRouteTime,
                'onTimeRate' => $onTimeRate,
                'customerRating' => $customerRating,
            ],
        ]);
    }

    /**
     * Get delivery history for this driver.
     * 
     * GET /api/driver/delivery-history?limit=50&offset=0&date=2026-01-01
     */
    public function getDeliveryHistory(Request $request): JsonResponse
    {
        $driver = $request->user();
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);
        $date = $request->query('date');

        $query = DriverAssignment::where('driver_id', $driver->id)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'desc');

        if ($date) {
            $queryDate = \Carbon\Carbon::parse($date)->startOfDay();
            $query->whereBetween('completed_at', [
                $queryDate,
                $queryDate->copy()->endOfDay(),
            ]);
        }

        $total = $query->count();
        $deliveries = $query->offset($offset)->limit($limit)->get();

        $history = $deliveries->map(function ($assignment) {
            $stops = collect($assignment->stops)->filter(fn ($s) => !($s['is_depot'] ?? false))->values();
            $stopStatuses = $assignment->stop_statuses ?? [];
            $completedCount = count(array_filter($stopStatuses, fn ($s) => ($s['status'] ?? null) === 'completed'));

            return [
                'id' => $assignment->id,
                'vehicle_index' => $assignment->vehicle_index,
                'instance' => $assignment->instance,
                'algorithm' => $assignment->algorithm,
                'total_distance' => $assignment->total_distance,
                'num_stops' => $stops->count(),
                'completed_count' => $completedCount,
                'status' => $assignment->status,
                'assigned_at' => $assignment->assigned_at?->toIso8601String(),
                'accepted_at' => $assignment->accepted_at?->toIso8601String(),
                'completed_at' => $assignment->completed_at?->toIso8601String(),
            ];
        })->toArray();

        return response()->json([
            'ok' => true,
            'deliveries' => $history,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     * Returns distance in meters.
     */
    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth_radius = 6371000; // meters
        $lat1_rad = deg2rad($lat1);
        $lat2_rad = deg2rad($lat2);
        $delta_lat = deg2rad($lat2 - $lat1);
        $delta_lng = deg2rad($lng2 - $lng1);

        $a = sin($delta_lat / 2) * sin($delta_lat / 2) +
            cos($lat1_rad) * cos($lat2_rad) *
            sin($delta_lng / 2) * sin($delta_lng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earth_radius * $c;
    }

    /**
     * Get all photos for an assignment.
     * Can be used by both drivers (to see their own photos) and admin (to review).
     */
    public function getPhotos(
        Request $request,
        int $assignment,
    ): JsonResponse {
        $model = DriverAssignment::find($assignment);
        abort_unless($model && $model->driver_id === $request->user()->id, 403);

        $photos = DeliveryPhoto::forAssignment($assignment)
            ->orderBy('stop_raw_index')
            ->orderBy('uploaded_at', 'desc')
            ->get();

        return response()->json([
            'ok'     => true,
            'photos' => $photos,
        ]);
    }

    /**
     * Get delivery proofs (photos and signatures) for the authenticated driver.
     * Supports filtering by date range and driver.
     *
     * GET /api/driver/delivery-proofs?from=2026-01-01&to=2026-12-31&driver_id=1
     */
    public function getDeliveryProofs(Request $request): JsonResponse
    {
        $driver = $request->user();
        $from = $request->query('from');
        $to = $request->query('to');

        $query = DeliveryPhoto::query()
            ->join('driver_assignments', 'delivery_photos.driver_assignment_id', '=', 'driver_assignments.id')
            ->where('driver_assignments.driver_id', $driver->id)
            ->select('delivery_photos.*', 'driver_assignments.vehicle_index')
            ->whereNotNull('delivery_photos.photo_url'); // Only photos, not signature-only records

        // Filter by date range if provided
        if ($from) {
            $query->whereDate('delivery_photos.photo_taken_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('delivery_photos.photo_taken_at', '<=', $to);
        }

        $photos = $query
            ->orderBy('delivery_photos.photo_taken_at', 'desc')
            ->get()
            ->map(function ($photo) use ($driver) {
                return [
                    'id' => $photo->id,
                    'photo_url' => $photo->photo_url,
                    'photo_lat' => $photo->photo_lat,
                    'photo_lng' => $photo->photo_lng,
                    'location_verified' => $photo->location_verified,
                    'location_distance_m' => $photo->location_distance_m,
                    'driver_name' => $driver->name,
                    'stop_raw_index' => $photo->stop_raw_index,
                    'photo_taken_at' => $photo->photo_taken_at?->toIso8601String(),
                    'uploaded_at' => $photo->uploaded_at?->toIso8601String(),
                    'notes' => $photo->notes,
                    'signature_url' => $photo->signature_url,
                ];
            });

        return response()->json([
            'ok' => true,
            'photos' => $photos,
        ]);
    }

    /**
     * Record driver location during delivery.
     *
     * POST body: { lat: float, lng: float, accuracy?: float, speed?: float, heading?: int, timestamp?: ISO8601 }
     */
    public function recordLocation(
        Request $request,
        int $assignment,
    ): JsonResponse {
        $model = DriverAssignment::find($assignment);
        abort_unless($model && $model->driver_id === $request->user()->id, 403);

        $data = $request->validate([
            'lat'       => ['required', 'numeric', 'between:-90,90'],
            'lng'       => ['required', 'numeric', 'between:-180,180'],
            'accuracy'  => ['nullable', 'numeric', 'min:0'],
            'speed'     => ['nullable', 'numeric', 'min:0'],
            'heading'   => ['nullable', 'integer', 'between:0,360'],
            'timestamp' => ['nullable', 'date'],
        ]);

        // Store location record
        $location = DriverLocation::create([
            'driver_assignment_id' => $assignment,
            'latitude'             => $data['lat'],
            'longitude'            => $data['lng'],
            'accuracy'             => $data['accuracy'] ?? null,
            'speed'                => $data['speed'] ?? null,
            'heading'              => $data['heading'] ?? null,
            'recorded_at'          => $data['timestamp'] ?
                \Carbon\Carbon::parse($data['timestamp']) : now(),
        ]);

        return response()->json([
            'ok'       => true,
            'location' => $location,
        ], 201);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function formatAssignment(DriverAssignment $a): array
    {
        $statuses = $a->stop_statuses ?? [];
        $stops = collect($a->stops)->map(function ($stop, $rawIndex) use ($statuses) {
            // Ensure snapped_lat and snapped_lng are present; fall back to lat/lng if missing
            $snappedLat = $stop['snapped_lat'] ?? $stop['lat'];
            $snappedLng = $stop['snapped_lng'] ?? $stop['lng'];
            
            // Build sequence (1-based, depots excluded from count)
            return array_merge($stop, [
                'snapped_lat'  => $snappedLat,
                'snapped_lng'  => $snappedLng,
                'raw_index'    => $rawIndex,
                'stop_status'  => $statuses[$rawIndex] ?? null,
            ]);
        })->values()->toArray();

        return [
            'id'             => $a->id,
            'instance'       => $a->instance,
            'algorithm'      => $a->algorithm,
            'vehicle_index'  => $a->vehicle_index,
            'color'          => $a->color,
            'total_distance' => $a->total_distance,
            'num_stops'      => $a->num_stops,
            'stops'          => $stops,
            'stop_statuses'  => $statuses,
            // GeoJSON coordinates [[lng,lat], ...] — null when OSMnx was unavailable at dispatch time
            'geometry'       => $a->geometry,
            'status'         => $a->status,
            'assigned_at'    => $a->assigned_at?->toISOString(),
            'accepted_at'    => $a->accepted_at?->toISOString(),
            'completed_at'   => $a->completed_at?->toISOString(),
        ];
    }
}
