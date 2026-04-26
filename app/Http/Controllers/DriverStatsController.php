<?php

namespace App\Http\Controllers;

use App\Models\DriverAssignment;
use Illuminate\Http\JsonResponse;

class DriverStatsController extends Controller
{
    /**
     * Get comprehensive driver statistics and metrics
     */
    public function getSummary(): JsonResponse
    {
        $driver = auth()->user();
        
        // Last 30 days
        $thirtyDaysAgo = now()->subDays(30);
        
        $assignments = DriverAssignment::where('driver_id', $driver->id)
            ->where('assigned_at', '>=', $thirtyDaysAgo)
            ->get();
        
        $completed = $assignments->where('status', 'completed')->count();
        $total = $assignments->count();
        $completionRate = $total > 0 ? round(($completed / $total) * 100, 1) : 0;
        
        // Today's stops
        $todayStops = DriverAssignment::where('driver_id', $driver->id)
            ->whereDate('assigned_at', today())
            ->sum('num_stops') ?? 0;
        
        // On-time rate (completed assignments that finished before time window end)
        $onTimeCount = $assignments
            ->where('status', 'completed')
            ->filter(fn ($a) => $a->completed_at && $a->stops)
            ->count();
        
        $onTimeRate = $completed > 0 ? round(($onTimeCount / $completed) * 100, 1) : 0;
        
        // Total distance
        $totalDistance = $assignments->sum('total_distance') ?? 0;
        
        // Earnings estimate (assuming $0.50 per stop)
        $earnings = ($completed * 1.50) + ($totalDistance * 0.001);
        
        return response()->json([
            'ok' => true,
            'stats' => [
                'completion_rate' => $completionRate,
                'stops_today' => $todayStops,
                'on_time_rate' => $onTimeRate,
                'earnings_estimate' => round($earnings, 2),
                'total_distance' => round($totalDistance, 1),
                'completed_count' => $completed,
                'total_count' => $total,
            ],
        ]);
    }
}
