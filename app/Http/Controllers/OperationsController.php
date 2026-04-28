<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class OperationsController extends Controller
{
    // A driver with no heartbeat for this long while in_progress is flagged.
    private const STUCK_THRESHOLD_MINUTES = 20;

    // Speed assumption for ETA (km/h city average).
    private const AVG_SPEED_KMH = 25;

    // Estimated minutes spent per stop (parking + delivery).
    private const MINUTES_PER_STOP = 8;

    public function show(): Response
    {
        $drivers = User::role('driver')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
            ->values();

        return Inertia::render('operations/index', [
            'mapboxToken' => config('services.mapbox.token'),
            'drivers'     => $drivers,
            'initial'     => $this->payload(),
        ]);
    }

    public function live(): JsonResponse
    {
        return response()->json(['ok' => true, ...$this->payload()]);
    }

    public function requeue(Request $request): JsonResponse
    {
        $data = $request->validate([
            'assignment_id' => ['required', 'integer', 'exists:driver_assignments,id'],
            'stop_index'    => ['required', 'integer', 'min:0'],
            'driver_id'     => ['required', 'integer', 'exists:users,id'],
        ]);

        $source = DriverAssignment::find($data['assignment_id']);

        if (! $source) {
            return response()->json(['ok' => false, 'error' => 'Assignment not found'], 404);
        }

        $stops    = $source->stops ?? [];
        $statuses = $source->stop_statuses ?? [];
        $idx      = $data['stop_index'];

        if (! isset($stops[$idx])) {
            return response()->json(['ok' => false, 'error' => 'Stop index out of range'], 422);
        }

        // Find depot stop to bookend the re-queued run.
        $depot = collect($stops)->first(fn ($s) => $s['is_depot'] ?? false) ?? $stops[0];

        // Build the mini-assignment stops: depot → failed stop → depot.
        $failedStop = array_merge($stops[$idx], ['raw_index' => 0]);
        $newStops = [
            array_merge($depot, ['is_depot' => true]),
            $failedStop,
            array_merge($depot, ['is_depot' => true]),
        ];

        $nextVehicle = DriverAssignment::max('vehicle_index') + 1;

        $assignment = DriverAssignment::create([
            'driver_id'      => $data['driver_id'],
            'instance'       => $source->instance,
            'algorithm'      => $source->algorithm,
            'vehicle_index'  => $nextVehicle,
            'color'          => $source->color,
            'total_distance' => null,
            'num_stops'      => 1,
            'stops'          => $newStops,
            'status'         => 'pending',
            'assigned_at'    => now(),
        ]);

        // Mark the original stop as requeued so it leaves the failed queue.
        $statuses[$idx] = array_merge($statuses[$idx] ?? [], [
            'status'      => 'requeued',
            'requeued_to' => $assignment->id,
            'recorded_at' => now()->toISOString(),
        ]);
        $source->stop_statuses = $statuses;
        $source->save();

        return response()->json(['ok' => true, 'assignment_id' => $assignment->id]);
    }

    // ── Internal helpers ────────────────────────────────────────────────────

    private function payload(): array
    {
        $today = Carbon::today();

        $assignments = DriverAssignment::with([
            'driver:id,name,last_seen_at',
            'latestLocation',
        ])
            ->whereIn('status', ['pending', 'accepted', 'in_progress'])
            ->orderByDesc('assigned_at')
            ->get();

        $rows = $assignments->map(fn ($a) => $this->formatAssignment($a))->values();

        $failedToday = DriverAssignment::where('updated_at', '>=', $today)
            ->get(['stop_statuses'])
            ->sum(fn ($a) => collect($a->stop_statuses ?? [])
                ->filter(fn ($s) => ($s['status'] ?? '') === 'failed')->count());

        $stuckCount = $rows->filter(fn ($r) => $r['is_stuck'])->count();

        return [
            'assignments' => $rows,
            'summary'     => [
                'active'             => $rows->count(),
                'completed_today'    => DriverAssignment::where('status', 'completed')
                    ->whereDate('completed_at', $today)->count(),
                'stuck'              => $stuckCount,
                'failed_stops_today' => $failedToday,
                'drivers_online'     => User::role('driver')
                    ->where('last_seen_at', '>=', now()->subMinutes(5))->count(),
            ],
        ];
    }

    private function formatAssignment(DriverAssignment $a): array
    {
        $stops    = collect($a->stops ?? []);
        $statuses = $a->stop_statuses ?? [];

        $nonDepot = $stops->filter(fn ($s) => ! ($s['is_depot'] ?? false));
        $total    = $nonDepot->count();

        $done   = collect($statuses)->filter(fn ($s) => in_array($s['status'] ?? '', ['completed', 'requeued']))->count();
        $failed = collect($statuses)->filter(fn ($s) => ($s['status'] ?? '') === 'failed')->count();

        // Build failed stop list for the re-queue UI.
        $failedStops = [];
        foreach ($stops as $rawIdx => $stop) {
            $st = $statuses[$rawIdx] ?? null;
            if (($st['status'] ?? '') === 'failed') {
                $failedStops[] = [
                    'stop_index'  => $rawIdx,
                    'stop'        => $stop,
                    'reason'      => $st['notes'] ?? null,
                    'recorded_at' => $st['recorded_at'] ?? null,
                ];
            }
        }

        // ETA estimate.
        $remaining = max(0, $total - $done - $failed);
        $donePct   = $total > 0 ? ($done + $failed) / $total : 0;
        $remDist   = (float) ($a->total_distance ?? 0) * (1.0 - $donePct);
        $etaMin    = $remaining > 0
            ? (int) round($remaining * self::MINUTES_PER_STOP + $remDist / self::AVG_SPEED_KMH * 60)
            : 0;

        // Stuck detection.
        $lastSeen = $a->driver?->last_seen_at;
        $isStuck  = $a->status === 'in_progress'
            && (! $lastSeen || Carbon::parse($lastSeen)->lt(now()->subMinutes(self::STUCK_THRESHOLD_MINUTES)));

        $loc = $a->latestLocation;

        return [
            'id'             => $a->id,
            'driver_id'      => $a->driver_id,
            'driver_name'    => $a->driver?->name ?? 'Unknown',
            'vehicle_label'  => 'V-' . str_pad((string) ($a->vehicle_index + 1), 2, '0', STR_PAD_LEFT),
            'color'          => $a->color ?? '#94a3b8',
            'status'         => $a->status,
            'instance'       => $a->instance,
            'stops_total'    => $total,
            'stops_done'     => $done,
            'stops_failed'   => $failed,
            'failed_stops'   => $failedStops,
            'total_distance' => $a->total_distance,
            'eta_minutes'    => $etaMin,
            'is_online'      => $a->driver?->last_seen_at
                ? Carbon::parse($a->driver->last_seen_at)->gt(now()->subMinutes(5))
                : false,
            'is_stuck'       => $isStuck,
            'last_seen_at'   => $a->driver?->last_seen_at?->toIso8601String(),
            'lat'            => $loc ? (float) $loc->latitude  : null,
            'lng'            => $loc ? (float) $loc->longitude : null,
            'heading'        => $loc?->heading,
            'speed'          => $loc ? (float) $loc->speed : null,
            'assigned_at'    => $a->assigned_at?->toIso8601String(),
            'accepted_at'    => $a->accepted_at?->toIso8601String(),
            'geometry'       => $a->geometry,
        ];
    }
}
