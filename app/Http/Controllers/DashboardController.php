<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = Carbon::today();

        $activeStatuses   = ['pending', 'accepted', 'in_progress'];
        $activeCount      = DriverAssignment::whereIn('status', $activeStatuses)->count();
        $completedToday   = DriverAssignment::where('status', 'completed')
            ->whereDate('completed_at', $today)->count();
        $totalDistanceToday = (float) DriverAssignment::where('status', 'completed')
            ->whereDate('completed_at', $today)->sum('total_distance');

        $driverRoleUsers = User::role('driver')->get(['id', 'name']);
        $driversTotal    = $driverRoleUsers->count();
        $activeDriverIds = DriverAssignment::whereIn('status', $activeStatuses)
            ->distinct()->pluck('driver_id');
        $driversOnRoad   = $activeDriverIds->count();

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
                'name'  => 'Drivers on road',
                'value' => (string) $driversOnRoad,
                'unit'  => $driversTotal > 0 ? "/{$driversTotal}" : null,
                'delta' => $driversTotal > 0
                    ? number_format(($driversOnRoad / max($driversTotal, 1)) * 100, 0).'%'
                    : '—',
                'note'  => 'of the roster',
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
                'id'      => $u->id,
                'name'    => $u->name,
                'status'  => $a ? $a->status : 'idle',
                'color'   => $a?->color,
                'stops'   => $a?->num_stops,
                'vehicle' => $a ? 'V-'.str_pad((string) $a->vehicle_index + 1, 2, '0', STR_PAD_LEFT) : null,
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

        return Inertia::render('dashboard', [
            'stats'        => $stats,
            'activeRoutes' => $activeRoutes,
            'fleet'        => $fleet,
            'recent'       => $recent,
            'series'       => $series,
        ]);
    }
}
