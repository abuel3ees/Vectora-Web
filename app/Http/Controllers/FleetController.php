<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class FleetController extends Controller
{
    public function __invoke(): Response
    {
        $activeStatuses = ['pending', 'accepted', 'in_progress'];

        $drivers = User::role('driver')
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(function (User $u) use ($activeStatuses) {
                $all = DriverAssignment::where('driver_id', $u->id)
                    ->orderByDesc('assigned_at')
                    ->get(['id', 'instance', 'algorithm', 'vehicle_index', 'color',
                           'total_distance', 'num_stops', 'status',
                           'assigned_at', 'accepted_at', 'completed_at']);

                $completed  = $all->where('status', 'completed');
                $active     = $all->whereIn('status', $activeStatuses)->first();

                $totalDist  = (float) $all->whereNotNull('total_distance')->sum('total_distance');
                $totalStops = (int)   $all->whereNotNull('num_stops')->sum('num_stops');

                return [
                    'id'     => $u->id,
                    'name'   => $u->name,
                    'email'  => $u->email,
                    'joined' => $u->created_at?->toDateString(),
                    'status' => $active ? $active->status : 'idle',
                    'current' => $active ? [
                        'id'             => $active->id,
                        'instance'       => $active->instance,
                        'algorithm'      => $active->algorithm,
                        'vehicle_label'  => 'V-'.str_pad((string) $active->vehicle_index + 1, 2, '0', STR_PAD_LEFT),
                        'color'          => $active->color,
                        'total_distance' => $active->total_distance,
                        'num_stops'      => $active->num_stops,
                        'status'         => $active->status,
                        'assigned_at'    => $active->assigned_at?->diffForHumans(),
                    ] : null,
                    'stats' => [
                        'total_routes'     => $all->count(),
                        'completed_routes' => $completed->count(),
                        'total_distance'   => round($totalDist, 1),
                        'total_stops'      => $totalStops,
                        'completion_rate'  => $all->count() > 0
                            ? round(($completed->count() / $all->count()) * 100)
                            : null,
                    ],
                    'history' => $all->take(5)->map(fn ($a) => [
                        'id'             => $a->id,
                        'instance'       => $a->instance,
                        'vehicle_label'  => 'V-'.str_pad((string) $a->vehicle_index + 1, 2, '0', STR_PAD_LEFT),
                        'color'          => $a->color,
                        'total_distance' => $a->total_distance,
                        'num_stops'      => $a->num_stops,
                        'status'         => $a->status,
                        'assigned_at'    => $a->assigned_at?->toDateString(),
                        'completed_at'   => $a->completed_at?->diffForHumans(),
                    ])->values(),
                ];
            })->values();

        $totalDrivers  = $drivers->count();
        $activeDrivers = $drivers->where('status', '!=', 'idle')->count();

        return Inertia::render('fleet/index', [
            'drivers' => $drivers,
            'summary' => [
                'total'   => $totalDrivers,
                'active'  => $activeDrivers,
                'idle'    => $totalDrivers - $activeDrivers,
            ],
        ]);
    }
}
