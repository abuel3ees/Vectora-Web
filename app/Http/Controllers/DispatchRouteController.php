<?php

namespace App\Http\Controllers;

use App\Models\DispatchRoute;
use App\Models\DriverAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class DispatchRouteController extends Controller
{
    public function index()
    {
        $this->authorize('view routes');

        $algorithms = DriverAssignment::distinct()->pluck('algorithm')->filter()->sort()->values();

        $routes = QueryBuilder::for(DispatchRoute::class)
            ->allowedFilters(
                AllowedFilter::exact('status'),
                AllowedFilter::partial('name'),
                AllowedFilter::callback('algorithm', function ($query, $value) {
                    $instances = DriverAssignment::where('algorithm', $value)->pluck('instance');
                    $query->whereIn('name', $instances);
                }),
                AllowedFilter::callback('driver', function ($query, $value) {
                    $instances = DriverAssignment::whereHas('driver', fn ($q) =>
                        $q->where('name', 'like', "%{$value}%")
                    )->pluck('instance');
                    $query->whereIn('name', $instances);
                }),
                AllowedFilter::callback('date_from', fn ($query, $value) =>
                    $query->whereDate('created_at', '>=', $value)
                ),
                AllowedFilter::callback('date_to', fn ($query, $value) =>
                    $query->whereDate('created_at', '<=', $value)
                ),
            )
            ->allowedSorts('id', 'name', 'status', 'created_at', 'updated_at')
            ->defaultSort('-created_at')
            ->paginate(15)
            ->withQueryString();

        $routes->getCollection()->transform(function ($route) {
            $assignments = DriverAssignment::where('instance', $route->name)
                ->with('driver:id,name,email')
                ->orderBy('vehicle_index')
                ->get();

            $route->assignments_count = $assignments->count();
            $route->total_stops       = $assignments->sum('num_stops');
            $route->total_distance    = $assignments->sum('total_distance');
            $route->completed_count   = $assignments->where('status', 'completed')->count();
            $route->in_progress_count = $assignments->where('status', 'in_progress')->count();
            $route->pending_count     = $assignments->where('status', 'pending')->count();
            $route->algorithm         = $assignments->first()?->algorithm;
            $route->dispatched_at     = $assignments->first()?->assigned_at?->toISOString();

            $route->drivers = $assignments->map(fn ($a) => [
                'assignment_id'  => $a->id,
                'driver_id'      => $a->driver_id,
                'name'           => $a->driver?->name ?? 'Unknown Driver',
                'email'          => $a->driver?->email ?? '',
                'vehicle_index'  => $a->vehicle_index,
                'color'          => $a->color ?? '#E07B53',
                'status'         => $a->status,
                'num_stops'      => $a->num_stops,
                'total_distance' => $a->total_distance,
            ])->values();

            return $route;
        });

        return Inertia::render('Routes/Index', [
            'routes'           => $routes,
            'filters'          => request()->all(['filter', 'sort']),
            'availableFilters' => [
                'status'     => ['pending', 'in_progress', 'completed'],
                'algorithms' => $algorithms,
            ],
        ]);
    }

    public function create()
    {
        $this->authorize('create routes');
        return Inertia::render('Routes/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create routes');

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'status'      => 'required|string|in:pending,in_progress,completed',
            'description' => 'nullable|string',
        ]);

        DispatchRoute::create($validated);

        return redirect()->route('routes.index')->with('success', 'Route created successfully.');
    }

    public function edit(DispatchRoute $dispatchRoute)
    {
        $this->authorize('edit routes');

        return Inertia::render('Routes/Edit', [
            'dispatchRoute' => $dispatchRoute,
        ]);
    }

    public function update(Request $request, DispatchRoute $dispatchRoute)
    {
        $this->authorize('edit routes');

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'status'      => 'required|string|in:pending,in_progress,completed',
            'description' => 'nullable|string',
        ]);

        $dispatchRoute->update($validated);

        return redirect()->route('routes.index')->with('success', 'Route updated successfully.');
    }

    public function show(DispatchRoute $dispatchRoute)
    {
        $this->authorize('view routes');

        $assignments = DriverAssignment::where('instance', $dispatchRoute->name)
            ->with(['driver:id,name,email', 'photos'])
            ->orderBy('vehicle_index')
            ->get()
            ->map(function ($a) {
                return [
                    'id'             => $a->id,
                    'driver_id'      => $a->driver_id,
                    'driver_name'    => $a->driver?->name ?? 'Unknown Driver',
                    'driver_email'   => $a->driver?->email ?? '',
                    'vehicle_index'  => $a->vehicle_index,
                    'color'          => $a->color ?? '#E07B53',
                    'status'         => $a->status,
                    'algorithm'      => $a->algorithm,
                    'total_distance' => $a->total_distance,
                    'num_stops'      => $a->num_stops,
                    'stops'          => collect($a->stops ?? [])->map(
                        fn ($stop, $i) => array_merge($stop, ['raw_index' => $i])
                    )->values()->toArray(),
                    'stop_statuses'  => $a->stop_statuses ?? [],
                    'assigned_at'    => $a->assigned_at?->toISOString(),
                    'accepted_at'    => $a->accepted_at?->toISOString(),
                    'completed_at'   => $a->completed_at?->toISOString(),
                    'photos'         => $a->photos->map(fn ($p) => [
                        'id'                  => $p->id,
                        'stop_raw_index'      => $p->stop_raw_index,
                        'photo_url'           => $p->photo_url,
                        'notes'               => $p->notes,
                        'photo_lat'           => $p->photo_lat,
                        'photo_lng'           => $p->photo_lng,
                        'location_verified'   => $p->location_verified,
                        'location_distance_m' => $p->location_distance_m,
                        'photo_taken_at'      => $p->photo_taken_at?->toISOString(),
                        'uploaded_at'         => $p->uploaded_at?->toISOString(),
                    ]),
                ];
            });

        return Inertia::render('Routes/Show', [
            'dispatchRoute' => $dispatchRoute,
            'assignments'   => $assignments,
        ]);
    }

    public function destroy(DispatchRoute $dispatchRoute)
    {
        $this->authorize('delete routes');

        $dispatchRoute->delete();

        return redirect()->route('routes.index')->with('success', 'Route deleted successfully.');
    }
}
