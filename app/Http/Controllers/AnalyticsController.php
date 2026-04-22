<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __invoke(): Response
    {
        $today = Carbon::today();
        $from30 = $today->copy()->subDays(29);

        // 30-day daily series — routes completed + distance
        $rawDaily = DriverAssignment::selectRaw(
                "date(completed_at) as d,
                 count(*) as routes,
                 coalesce(sum(total_distance), 0) as distance"
            )
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $from30)
            ->groupBy('d')
            ->orderBy('d')
            ->get()
            ->keyBy('d');

        $series = [];
        for ($i = 0; $i < 30; $i++) {
            $day = $from30->copy()->addDays($i)->toDateString();
            $row = $rawDaily[$day] ?? null;
            $series[] = [
                'd'        => $day,
                'routes'   => $row ? (int) $row->routes   : 0,
                'distance' => $row ? round((float) $row->distance, 1) : 0.0,
            ];
        }

        // Driver leaderboard — all time
        $leaderboard = User::role('driver')
            ->get(['id', 'name'])
            ->map(function (User $u) {
                $all       = DriverAssignment::where('driver_id', $u->id);
                $completed = (clone $all)->where('status', 'completed');

                $routes   = $completed->count();
                $distance = round((float) $completed->sum('total_distance'), 1);
                $stops    = (int) $completed->sum('num_stops');
                $total    = $all->count();

                return [
                    'id'              => $u->id,
                    'name'            => $u->name,
                    'routes'          => $routes,
                    'distance'        => $distance,
                    'stops'           => $stops,
                    'completion_rate' => $total > 0 ? round(($routes / $total) * 100) : null,
                ];
            })
            ->sortByDesc('routes')
            ->values();

        // Algorithm performance
        $algorithms = DriverAssignment::selectRaw(
                "algorithm,
                 count(*) as count,
                 coalesce(avg(total_distance), 0) as avg_distance,
                 coalesce(avg(num_stops), 0) as avg_stops"
            )
            ->where('status', 'completed')
            ->groupBy('algorithm')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'name'         => $r->algorithm,
                'count'        => (int) $r->count,
                'avg_distance' => round((float) $r->avg_distance, 1),
                'avg_stops'    => round((float) $r->avg_stops, 1),
            ])
            ->values();

        // Totals
        $totalCompleted  = DriverAssignment::where('status', 'completed')->count();
        $totalDistance   = round((float) DriverAssignment::where('status', 'completed')->sum('total_distance'), 1);
        $totalStops      = (int) DriverAssignment::where('status', 'completed')->sum('num_stops');
        $totalDrivers    = User::role('driver')->count();

        return Inertia::render('analytics/index', [
            'series'      => $series,
            'leaderboard' => $leaderboard,
            'algorithms'  => $algorithms,
            'totals'      => [
                'completed' => $totalCompleted,
                'distance'  => $totalDistance,
                'stops'     => $totalStops,
                'drivers'   => $totalDrivers,
            ],
        ]);
    }
}
