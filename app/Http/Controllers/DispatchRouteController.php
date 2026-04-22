<?php

namespace App\Http\Controllers;

use App\Models\DispatchRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class DispatchRouteController extends Controller
{
    public function index()
    {
        $this->authorize('view routes');

        $routes = QueryBuilder::for(DispatchRoute::class)
            ->allowedFilters('name', 'status')
            ->allowedSorts('id', 'name', 'status', 'created_at')
            ->defaultSort('-created_at')
            ->paginate()
            ->withQueryString();

        return Inertia::render('Routes/Index', [
            'routes' => $routes,
            'filters' => request()->all(['filter', 'sort'])
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
            'name' => 'required|string|max:255',
            'status' => 'required|string|in:pending,in_progress,completed',
            'description' => 'nullable|string',
        ]);

        DispatchRoute::create($validated);

        return redirect()->route('routes.index')->with('success', 'Route created successfully.');
    }

    public function edit(DispatchRoute $dispatchRoute)
    {
        $this->authorize('edit routes');

        return Inertia::render('Routes/Edit', [
            'dispatchRoute' => $dispatchRoute
        ]);
    }

    public function update(Request $request, DispatchRoute $dispatchRoute)
    {
        $this->authorize('edit routes');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|string|in:pending,in_progress,completed',
            'description' => 'nullable|string',
        ]);

        $dispatchRoute->update($validated);

        return redirect()->route('routes.index')->with('success', 'Route updated successfully.');
    }

    public function destroy(DispatchRoute $dispatchRoute)
    {
        $this->authorize('delete routes');

        $dispatchRoute->delete();

        return redirect()->route('routes.index')->with('success', 'Route deleted successfully.');
    }
}
