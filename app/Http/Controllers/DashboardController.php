<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
use App\Models\DriverLocation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Build current live map payload for active assignments.
     * Only includes drivers that have actually sent heartbeats (have last_seen_at set).
     */
    private function liveLocationsPayload(): array
    {
        $activeStatuses = ['pending', 'accepted', 'in_progress'];

        return DriverAssignment::with([
            'driver:id,name,last_seen_at',
            'latestLocation' => function ($query) {
                $query->select([
                    'driver_locations.id',
                    'driver_locations.driver_assignment_id',
                    'driver_locations.latitude',
                    'driver_locations.longitude',
                    'driver_locations.accuracy',
                    'driver_locations.speed',
                    'driver_locations.heading',
                    'driver_locations.recorded_at',
                ]);
            },
        ])
            ->whereIn('status', $activeStatuses)
            ->orderByDesc('assigned_at')
            ->get(['id', 'driver_id', 'vehicle_index', 'status', 'color', 'stops', 'stop_statuses'])
            ->filter(function ($a) {
                // Only include drivers who have sent at least one heartbeat
                return $a->driver?->last_seen_at !== null;
            })
            ->map(function ($a) {
                $latest = $a->latestLocation;
                $fallback = $this->fallbackLocationForAssignment($a);

                if (! $latest && ! $fallback) {
                    return null;
                }

                return [
                    'assignment_id' => $a->id,
                    'driver_id' => $a->driver_id,
                    'driver_name' => $a->driver?->name ?? 'Unknown driver',
                    'vehicle_label' => 'V-'.str_pad((string) ($a->vehicle_index + 1), 2, '0', STR_PAD_LEFT),
                    'status' => $a->status,
                    'color' => $a->color,
                    'is_online' => $a->driver?->isOnline() ?? false,
                    'last_seen_at' => optional($a->driver?->last_seen_at)->toIso8601String(),
                    'lat' => (float) ($latest?->latitude ?? $fallback['lat']),
                    'lng' => (float) ($latest?->longitude ?? $fallback['lng']),
                    'accuracy' => $latest?->accuracy !== null ? (float) $latest->accuracy : null,
                    'speed' => $latest?->speed !== null ? (float) $latest->speed : null,
                    'heading' => $latest?->heading,
                    'recorded_at' => optional($latest?->recorded_at)->toIso8601String(),
                    'location_source' => $latest ? 'gps' : $fallback['source'],
                    'has_live_location' => $latest !== null,
                ];
            })
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * Use route geometry as a dispatcher-visible placeholder until the phone
     * posts its first GPS sample. This keeps assigned drivers visible.
     */
    private function fallbackLocationForAssignment(DriverAssignment $assignment): ?array
    {
        $stops = collect($assignment->stops ?? []);

        if ($stops->isEmpty()) {
            return null;
        }

        $statuses = $assignment->stop_statuses ?? [];
        $nextStop = $stops->first(function ($stop, $index) use ($statuses) {
            if ($stop['is_depot'] ?? false) {
                return false;
            }

            return ! isset($statuses[$index]['status']);
        });

        $stop = $nextStop
            ?? $stops->first(fn ($stop) => ! ($stop['is_depot'] ?? false))
            ?? $stops->first();

        $lat = $stop['snapped_lat'] ?? $stop['lat'] ?? null;
        $lng = $stop['snapped_lng'] ?? $stop['lng'] ?? null;

        if ($lat === null || $lng === null) {
            return null;
        }

        return [
            'lat' => $lat,
            'lng' => $lng,
            'source' => $nextStop ? 'next_stop' : 'route',
        ];
    }

    public function __invoke(): Response
    {
        $today = Carbon::today();

        $activeStatuses   = ['pending', 'accepted', 'in_progress'];
        $activeCount      = DriverAssignment::whereIn('status', $activeStatuses)->count();
        $completedToday   = DriverAssignment::where('status', 'completed')
            ->whereDate('completed_at', $today)->count();
        $totalDistanceToday = (float) DriverAssignment::where('status', 'completed')
            ->whereDate('completed_at', $today)->sum('total_distance');

        $driverRoleUsers = User::role('driver')->get(['id', 'name', 'last_seen_at']);
        $driversTotal    = $driverRoleUsers->count();
        $activeDriverIds = DriverAssignment::whereIn('status', $activeStatuses)
            ->distinct()->pluck('driver_id');
        $driversOnRoad   = $activeDriverIds->count();
        $onlineNow       = $driverRoleUsers->filter(fn ($u) => $u->isOnline())->count();

        $avgStops = (float) DriverAssignment::whereIn('status', $activeStatuses)->avg('num_stops');

        $stats = [
            [
                'name'  => 'Active routes',
                'value' => (string) $activeCount,
                'unit'  => null,
                'delta' => $completedToday > 0 ? "+{$completedToday} done" : '—',
                'note'  => 'in motion today',
            ],
            [
                'name'  => 'Online now',
                'value' => (string) $onlineNow,
                'unit'  => $driversTotal > 0 ? "/{$driversTotal}" : null,
                'delta' => $driversOnRoad > 0 ? "{$driversOnRoad} on road" : '—',
                'note'  => 'active in last 5 min',
            ],
            [
                'name'  => 'Avg. stops',
                'value' => $avgStops > 0 ? number_format($avgStops, 1) : '—',
                'unit'  => null,
                'delta' => $activeCount > 0 ? "across {$activeCount}" : '—',
                'note'  => 'per active route',
            ],
            [
                'name'  => 'Distance today',
                'value' => $totalDistanceToday > 0 ? number_format($totalDistanceToday, 1) : '—',
                'unit'  => $totalDistanceToday > 0 ? 'u' : null,
                'delta' => $completedToday > 0 ? "{$completedToday} runs" : '—',
                'note'  => 'completed, total',
            ],
        ];

        $activeRoutes = DriverAssignment::with('driver:id,name')
            ->whereIn('status', $activeStatuses)
            ->orderByDesc('assigned_at')
            ->limit(6)
            ->get(['id', 'driver_id', 'instance', 'algorithm', 'vehicle_index', 'color',
                   'total_distance', 'num_stops', 'status', 'assigned_at'])
            ->map(fn ($a) => [
                'id'             => $a->id,
                'driver'         => $a->driver?->name ?? 'Unassigned',
                'vehicle_label'  => 'V-'.str_pad((string) $a->vehicle_index + 1, 2, '0', STR_PAD_LEFT),
                'instance'       => $a->instance,
                'color'          => $a->color,
                'total_distance' => $a->total_distance,
                'num_stops'      => $a->num_stops,
                'status'         => $a->status,
                'assigned_at'    => optional($a->assigned_at)->toIso8601String(),
            ]);

        $fleet = $driverRoleUsers->map(function ($u) use ($activeStatuses) {
            $a = DriverAssignment::where('driver_id', $u->id)
                ->whereIn('status', $activeStatuses)
                ->orderByDesc('assigned_at')
                ->first();

            return [
                'id'            => $u->id,
                'name'          => $u->name,
                'status'        => $a ? $a->status : 'idle',
                'color'         => $a?->color,
                'stops'         => $a?->num_stops,
                'vehicle'       => $a ? 'V-'.str_pad((string) $a->vehicle_index + 1, 2, '0', STR_PAD_LEFT) : null,
                'is_online'     => $u->isOnline(),
                'last_seen_at'  => optional($u->last_seen_at)->toIso8601String(),
                'assignment_id' => $a?->id,
            ];
        })->values();

        $recent = DriverAssignment::with('driver:id,name')
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get(['id', 'driver_id', 'status', 'vehicle_index', 'color', 'updated_at'])
            ->map(fn ($a) => [
                'id'        => $a->id,
                'driver'    => $a->driver?->name ?? '—',
                'status'    => $a->status,
                'vehicle'   => 'V-'.str_pad((string) $a->vehicle_index + 1, 2, '0', STR_PAD_LEFT),
                'color'     => $a->color,
                'at'        => optional($a->updated_at)->diffForHumans(),
            ]);

        // 14-day completion volume for the chart.
        $from = $today->copy()->subDays(13);
        $daily = DriverAssignment::selectRaw("date(completed_at) as d, count(*) as c")
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $from)
            ->groupBy('d')->orderBy('d')->pluck('c', 'd');

        $series = [];
        for ($i = 0; $i < 14; $i++) {
            $day = $from->copy()->addDays($i)->toDateString();
            $series[] = ['d' => $day, 'c' => (int) ($daily[$day] ?? 0)];
        }

        $liveLocations = $this->liveLocationsPayload();

        // If no active locations exist yet, seed map center from the latest known phone location.
        if (count($liveLocations) === 0) {
            $anchor = DriverLocation::latest('recorded_at')->first();
            if ($anchor) {
                $liveLocations[] = [
                    'assignment_id' => null,
                    'driver_id'     => null,
                    'driver_name'   => 'Anchor',
                    'vehicle_label' => '—',
                    'status'        => 'idle',
                    'color'         => null,
                    'is_online'     => false,
                    'last_seen_at'  => null,
                    'lat'           => (float) $anchor->latitude,
                    'lng'           => (float) $anchor->longitude,
                    'accuracy'      => $anchor->accuracy !== null ? (float) $anchor->accuracy : null,
                    'speed'         => null,
                    'heading'       => null,
                    'recorded_at'   => optional($anchor->recorded_at)->toIso8601String(),
                ];
            }
        }

        return Inertia::render('dashboard', [
            'stats'        => $stats,
            'activeRoutes' => $activeRoutes,
            'fleet'        => $fleet,
            'recent'       => $recent,
            'series'       => $series,
            'mapboxToken'  => config('services.mapbox.token'),
            'liveLocations'=> $liveLocations,
        ]);
    }

    /**
     * Polling endpoint for the dashboard live map.
     */
    public function liveLocations(Request $request): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'locations' => $this->liveLocationsPayload(),
            'server_time' => now()->toIso8601String(),
        ]);
    }
}
