<?php

use App\Models\DispatchRoute;
use App\Models\DriverAssignment;
use App\Models\DriverLocation;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Role;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('driver:simulate
    {--drivers=3 : Number of active assignments to simulate}
    {--steps=1 : Number of update cycles to generate}
    {--interval=2 : Seconds between cycles}
    {--radius=0.0035 : Max jitter radius in degrees (~390m)}
    {--city=rio-claro : Fallback city to seed around when no phone anchor is available}
    {--anchor-lat= : Override anchor latitude}
    {--anchor-lng= : Override anchor longitude}
    {--anchor-assignment= : Use latest location from this assignment as anchor}', function () {
    $drivers = max(1, (int) $this->option('drivers'));
    $steps = max(1, (int) $this->option('steps'));
    $interval = max(0, (int) $this->option('interval'));
    $radius = max(0.0001, (float) $this->option('radius'));
    $anchorAssignment = $this->option('anchor-assignment');
    $anchorLat = $this->option('anchor-lat');
    $anchorLng = $this->option('anchor-lng');
    $city = strtolower(trim((string) $this->option('city')));
    $driverRole = Role::firstOrCreate(['name' => 'driver']);

    $anchor = null;
    if ($anchorLat !== null && $anchorLng !== null) {
        $anchor = (object) [
            'latitude' => (float) $anchorLat,
            'longitude' => (float) $anchorLng,
        ];
    } else {
        $anchorQuery = DriverLocation::query();
        if ($anchorAssignment !== null) {
            $anchorQuery->where('driver_assignment_id', (int) $anchorAssignment);
        }
        $anchor = $anchorQuery->latest('recorded_at')->first();
    }

    if (! $anchor) {
        $cityAnchors = [
            'rio-claro' => [-22.4076, -47.5635],
            'rioclaro' => [-22.4076, -47.5635],
            'rio claro' => [-22.4076, -47.5635],
        ];

        [$fallbackLat, $fallbackLng] = $cityAnchors[$city] ?? [-22.4076, -47.5635];
        $anchor = (object) [
            'latitude' => $fallbackLat,
            'longitude' => $fallbackLng,
        ];

        $this->warn(sprintf(
            'No phone anchor found, using %s center as fallback: %.6f, %.6f',
            $city === '' ? 'Rio Claro' : $city,
            (float) $anchor->latitude,
            (float) $anchor->longitude,
        ));
    }

    $activeStatuses = ['pending', 'accepted', 'in_progress'];

    $assignments = DriverAssignment::whereIn('status', $activeStatuses)
        ->orderByDesc('assigned_at')
        ->limit($drivers)
        ->get(['id', 'driver_id', 'vehicle_index']);

    if ($assignments->isEmpty()) {
        $this->warn('No active driver assignments found. Bootstrapping demo drivers in Rio Claro.');

        $demoInstance = 'Rio Claro Demo';
        $demoRoute = DispatchRoute::firstOrCreate(
            ['name' => $demoInstance],
            [
                'status' => 'pending',
                'description' => 'Auto-generated demo fleet for live tracking',
            ]
        );

        $palette = ['#E07B53', '#4F8CFF', '#7C9B6B', '#B56BF0', '#F2B134'];

        $buildStops = function (float $baseLat, float $baseLng, int $vehicleIndex): array {
            $delta = 0.0045 + ($vehicleIndex * 0.0006);

            return [
                [
                    'node_id' => 1000 + ($vehicleIndex * 10),
                    'lat' => $baseLat,
                    'lng' => $baseLng,
                    'snapped_lat' => $baseLat,
                    'snapped_lng' => $baseLng,
                    'is_depot' => true,
                    'address' => 'Rio Claro Depot',
                    'customer_name' => 'Depot',
                    'customer_phone' => null,
                ],
                [
                    'node_id' => 1001 + ($vehicleIndex * 10),
                    'lat' => $baseLat + $delta,
                    'lng' => $baseLng + ($delta / 2),
                    'snapped_lat' => $baseLat + $delta,
                    'snapped_lng' => $baseLng + ($delta / 2),
                    'is_depot' => false,
                    'address' => 'Rua 1, Rio Claro',
                    'customer_name' => 'Customer '.($vehicleIndex + 1).'A',
                    'customer_phone' => null,
                ],
                [
                    'node_id' => 1002 + ($vehicleIndex * 10),
                    'lat' => $baseLat - ($delta / 2),
                    'lng' => $baseLng + $delta,
                    'snapped_lat' => $baseLat - ($delta / 2),
                    'snapped_lng' => $baseLng + $delta,
                    'is_depot' => false,
                    'address' => 'Rua 2, Rio Claro',
                    'customer_name' => 'Customer '.($vehicleIndex + 1).'B',
                    'customer_phone' => null,
                ],
            ];
        };

        $baseAssignments = [];
        $users = [];
        for ($i = 1; $i <= $drivers; $i++) {
            $email = "driver{$i}@example.com";
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => "driver{$i}",
                    'password' => bcrypt('password'),
                ]
            );
            if (! $user->hasRole($driverRole)) {
                $user->assignRole($driverRole);
            }

            $users[] = $user;
        }

        foreach ($users as $index => $user) {
            $stops = $buildStops((float) $anchor->latitude, (float) $anchor->longitude, $index);
            $geometry = array_map(fn ($stop) => [$stop['lng'], $stop['lat']], $stops);

            $baseAssignments[] = DriverAssignment::updateOrCreate(
                [
                    'driver_id' => $user->id,
                    'instance' => $demoInstance,
                ],
                [
                    'algorithm' => 'simulation',
                    'vehicle_index' => $index,
                    'color' => $palette[$index % count($palette)],
                    'total_distance' => 0,
                    'num_stops' => count($stops) - 1,
                    'stops' => $stops,
                    'geometry' => $geometry,
                    'status' => 'pending',
                    'assigned_at' => now(),
                ]
            );
        }

        $assignments = collect($baseAssignments)
            ->pluck('id')
            ->pipe(fn ($ids) => DriverAssignment::whereIn('id', $ids)->get(['id', 'driver_id', 'vehicle_index']));

        $this->info(sprintf('Bootstrapped %d demo driver(s) and assignments for %s.', count($users), $demoRoute->name));
    }

    $this->info(sprintf(
        'Simulating %d driver(s), %d step(s), interval %ds around %.6f, %.6f',
        $assignments->count(),
        $steps,
        $interval,
        (float) $anchor->latitude,
        (float) $anchor->longitude,
    ));

    for ($step = 1; $step <= $steps; $step++) {
        foreach ($assignments as $assignment) {
            $previous = DriverLocation::where('driver_assignment_id', $assignment->id)
                ->latest('recorded_at')
                ->first();

            $baseLat = $previous ? (float) $previous->latitude : (float) $anchor->latitude;
            $baseLng = $previous ? (float) $previous->longitude : (float) $anchor->longitude;

            $latDelta = (mt_rand(-1000, 1000) / 1000) * $radius;
            $lngDelta = (mt_rand(-1000, 1000) / 1000) * $radius;

            $sample = DriverLocation::create([
                'driver_assignment_id' => $assignment->id,
                'latitude' => $baseLat + $latDelta,
                'longitude' => $baseLng + $lngDelta,
                'accuracy' => mt_rand(6, 20),
                'speed' => mt_rand(10, 160) / 10,
                'heading' => mt_rand(0, 359),
                'recorded_at' => now(),
            ]);

            $this->line(sprintf(
                'Step %d/%d -> assignment #%d @ %.6f, %.6f',
                $step,
                $steps,
                $assignment->id,
                (float) $sample->latitude,
                (float) $sample->longitude,
            ));
        }

        if ($step < $steps && $interval > 0) {
            sleep($interval);
        }
    }

    $this->info('Simulation complete.');
})->purpose('Generate dummy live driver locations near your latest phone position.');
