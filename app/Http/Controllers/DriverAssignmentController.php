<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
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
                'status'         => 'pending',
                'assigned_at'    => $now,
            ]);
        }

        return response()->json([
            'ok'          => true,
            'count'       => count($created),
            'assignments' => $created,
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
                   'status', 'assigned_at', 'accepted_at', 'completed_at'])
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
            'status'         => $a->status,
            'assigned_at'    => $a->assigned_at?->toISOString(),
            'accepted_at'    => $a->accepted_at?->toISOString(),
            'completed_at'   => $a->completed_at?->toISOString(),
        ];
    }
}
