<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\OptimizationHistory;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Process\Process;

class OptimizeController extends Controller
{
    private const ALGORITHMS = [
        // Construction heuristics
        'nearest_neighbour'            => 'Nearest neighbour',
        'nearest_neighbour_2opt'       => 'Nearest neighbour · 2-opt',
        'sweep'                        => 'Sweep',
        'sweep_2opt'                   => 'Sweep · 2-opt',
        'savings_parallel'             => 'Clarke–Wright parallel',
        'savings_parallel_2opt'        => 'Clarke–Wright parallel · 2-opt',
        'savings_parallel_oropt'       => 'Clarke–Wright parallel · Or-opt',
        'savings_sequential'           => 'Clarke–Wright sequential',
        'savings_sequential_2opt'      => 'Clarke–Wright sequential · 2-opt',
        'nearest_insertion'            => 'Nearest insertion',
        'nearest_insertion_2opt'       => 'Nearest insertion · 2-opt',
        'farthest_insertion'           => 'Farthest insertion',
        'farthest_insertion_2opt'      => 'Farthest insertion · 2-opt',
        'cheapest_insertion'           => 'Cheapest insertion',
        'cheapest_insertion_2opt'      => 'Cheapest insertion · 2-opt',
        // Metaheuristics
        'simulated_annealing'          => 'Simulated annealing',
        'tabu_search'                  => 'Tabu search',
        'iterated_local_search'        => 'Iterated local search',
        'genetic'                      => 'Genetic algorithm',
        // OR-Tools
        'ortools_gls'                  => 'OR-Tools · GLS',
        'ortools_sa'                   => 'OR-Tools · SA',
        'ortools_tabu'                 => 'OR-Tools · Tabu',
        'ortools_pca'                  => 'OR-Tools · PCA',
        'ortools_savings'              => 'OR-Tools · Savings',
        'ortools_christofides'         => 'OR-Tools · Christofides',
        'ortools_parallel_cheapest'    => 'OR-Tools · Parallel cheapest',
        // Quantum / recursive
        'recursive_qaoa'               => 'Recursive QAOA',
        'recursive_qaoa_2opt'          => 'Recursive QAOA · 2-opt',
    ];

    // Algorithm group labels — controls the collapsible sections in the UI.
    private const ALGORITHM_GROUPS = [
        'Construction'   => ['nearest_neighbour','nearest_neighbour_2opt','sweep','sweep_2opt','savings_parallel','savings_parallel_2opt','savings_parallel_oropt','savings_sequential','savings_sequential_2opt','nearest_insertion','nearest_insertion_2opt','farthest_insertion','farthest_insertion_2opt','cheapest_insertion','cheapest_insertion_2opt'],
        'Metaheuristics' => ['simulated_annealing','tabu_search','iterated_local_search','genetic'],
        'OR-Tools'       => ['ortools_gls','ortools_sa','ortools_tabu','ortools_pca','ortools_savings','ortools_christofides','ortools_parallel_cheapest'],
        'Quantum'        => ['recursive_qaoa','recursive_qaoa_2opt'],
    ];

    // Built-in instances — not deletable from the UI.
    // Rio Claro Post entries are Python-embedded arrays; all others are JSON files in scripts/instances/.
    private const BUILTIN_INSTANCES = [
        // Brazil — Rio Claro Post benchmark
        ['key' => '50',       'label' => '50 stops',         'size' => 50,   'group' => 'Brazil'],
        ['key' => '100',      'label' => '100 stops',        'size' => 100,  'group' => 'Brazil'],
        ['key' => '200',      'label' => '200 stops',        'size' => 200,  'group' => 'Brazil'],
        ['key' => '500',      'label' => '500 stops',        'size' => 500,  'group' => 'Brazil'],
        ['key' => '1000',     'label' => '1000 stops',       'size' => 1000, 'group' => 'Brazil'],
        ['key' => 'rioclaro', 'label' => 'Maison benchmark', 'size' => 50,   'group' => 'Brazil'],
        // Jordan — country + Amman city
        ['key' => 'jordan_100',          'label' => '100 stops',          'size' => 100, 'group' => 'Jordan'],
        ['key' => 'jordan_250',          'label' => '250 stops',          'size' => 250, 'group' => 'Jordan'],
        ['key' => 'jordan_500',          'label' => '500 stops',          'size' => 500, 'group' => 'Jordan'],
        ['key' => 'jordan_multicity_100','label' => 'Multi-city · 100',   'size' => 100, 'group' => 'Jordan'],
        ['key' => 'jordan_longhaul_150', 'label' => 'Long-haul · 150',    'size' => 150, 'group' => 'Jordan'],
        ['key' => 'jordan_cross_300',    'label' => 'Cross-country · 300','size' => 300, 'group' => 'Jordan'],
        ['key' => 'jordan_extreme_500',  'label' => 'Extreme · 500',      'size' => 500, 'group' => 'Jordan'],
        ['key' => 'amman_50',            'label' => 'Amman · 50',         'size' => 50,  'group' => 'Jordan'],
        ['key' => 'amman_100',           'label' => 'Amman · 100',        'size' => 100, 'group' => 'Jordan'],
        ['key' => 'amman_200',           'label' => 'Amman · 200',        'size' => 200, 'group' => 'Jordan'],
        // United States — city instances
        ['key' => 'nyc_50',      'label' => 'New York City · 50',   'size' => 50,  'group' => 'United States'],
        ['key' => 'nyc_100',     'label' => 'New York City · 100',  'size' => 100, 'group' => 'United States'],
        ['key' => 'nyc_200',     'label' => 'New York City · 200',  'size' => 200, 'group' => 'United States'],
        ['key' => 'nyc_500',     'label' => 'New York City · 500',  'size' => 500, 'group' => 'United States'],
        ['key' => 'chicago_50',  'label' => 'Chicago · 50',         'size' => 50,  'group' => 'United States'],
        ['key' => 'chicago_100', 'label' => 'Chicago · 100',        'size' => 100, 'group' => 'United States'],
        ['key' => 'chicago_200', 'label' => 'Chicago · 200',        'size' => 200, 'group' => 'United States'],
        ['key' => 'chicago_500', 'label' => 'Chicago · 500',        'size' => 500, 'group' => 'United States'],
        // United Kingdom — city instances
        ['key' => 'london_50',   'label' => 'London · 50',          'size' => 50,  'group' => 'United Kingdom'],
        ['key' => 'london_100',  'label' => 'London · 100',         'size' => 100, 'group' => 'United Kingdom'],
        ['key' => 'london_200',  'label' => 'London · 200',         'size' => 200, 'group' => 'United Kingdom'],
        ['key' => 'london_500',  'label' => 'London · 500',         'size' => 500, 'group' => 'United Kingdom'],
        // Germany — city instances
        ['key' => 'berlin_50',   'label' => 'Berlin · 50',          'size' => 50,  'group' => 'Germany'],
        ['key' => 'berlin_100',  'label' => 'Berlin · 100',         'size' => 100, 'group' => 'Germany'],
        ['key' => 'berlin_200',  'label' => 'Berlin · 200',         'size' => 200, 'group' => 'Germany'],
        ['key' => 'berlin_500',  'label' => 'Berlin · 500',         'size' => 500, 'group' => 'Germany'],
        ['key' => 'munich_50',   'label' => 'Munich · 50',          'size' => 50,  'group' => 'Germany'],
        ['key' => 'munich_100',  'label' => 'Munich · 100',         'size' => 100, 'group' => 'Germany'],
        ['key' => 'munich_200',  'label' => 'Munich · 200',         'size' => 200, 'group' => 'Germany'],
        ['key' => 'munich_500',  'label' => 'Munich · 500',         'size' => 500, 'group' => 'Germany'],
        // Italy — city instances
        ['key' => 'rome_50',     'label' => 'Rome · 50',            'size' => 50,  'group' => 'Italy'],
        ['key' => 'rome_100',    'label' => 'Rome · 100',           'size' => 100, 'group' => 'Italy'],
        ['key' => 'rome_200',    'label' => 'Rome · 200',           'size' => 200, 'group' => 'Italy'],
        ['key' => 'rome_500',    'label' => 'Rome · 500',           'size' => 500, 'group' => 'Italy'],
        ['key' => 'milan_50',    'label' => 'Milan · 50',           'size' => 50,  'group' => 'Italy'],
        ['key' => 'milan_100',   'label' => 'Milan · 100',          'size' => 100, 'group' => 'Italy'],
        ['key' => 'milan_200',   'label' => 'Milan · 200',          'size' => 200, 'group' => 'Italy'],
        ['key' => 'milan_500',   'label' => 'Milan · 500',          'size' => 500, 'group' => 'Italy'],
    ];

    public function show(): Response
    {
        $drivers = User::role('driver')
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->toArray();

        return Inertia::render('optimize/index', [
            'instances'   => $this->instances(),
            'algorithms'  => self::ALGORITHMS,
            'mapboxToken' => config('services.mapbox.token'),
            'drivers'     => $drivers,
        ]);
    }

    public function history(): Response
    {
        $history = OptimizationHistory::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->paginate(50, ['id', 'instance', 'k', 'algorithm', 'num_routes', 'total_distance', 'distance_std', 'elapsed', 'valid', 'issues', 'created_at']);

        return Inertia::render('optimize/History', [
            'history' => $history->items(),
        ]);
    }

    public function solve(Request $request): JsonResponse
    {
        $data = $request->validate([
            'instance'  => ['required', 'string'],
            'k'         => ['required', 'integer', 'min:1', 'max:100'],
            'algorithm' => ['required', 'string', 'in:'.implode(',', array_keys(self::ALGORITHMS))],
            'force'     => ['sometimes', 'boolean'],
        ]);

        $instance  = $data['instance'];
        $k         = (int) $data['k'];
        $algorithm = $data['algorithm'];
        $force     = (bool) ($data['force'] ?? false);

        // Check the file cache before spawning Python — same hash Python uses.
        if (! $force) {
            $cacheJson = '{"a": ' . json_encode($algorithm) . ', "i": ' . json_encode($instance) . ', "k": ' . $k . '}';
            $cacheHash = substr(sha1($cacheJson), 0, 16);
            $cachePath = storage_path("app/vrp/cache/{$cacheHash}.json");

            if (is_file($cachePath)) {
                $decoded = json_decode(file_get_contents($cachePath), true);
                if (is_array($decoded)) {
                    OptimizationHistory::create([
                        'user_id'        => auth()->id(),
                        'instance'       => $instance,
                        'k'              => $k,
                        'algorithm'      => $algorithm,
                        'num_routes'     => $decoded['summary']['num_routes'] ?? 0,
                        'total_distance' => $decoded['summary']['total_distance'] ?? null,
                        'distance_std'   => $decoded['summary']['distance_std'] ?? null,
                        'elapsed'        => $decoded['summary']['elapsed'] ?? null,
                        'valid'          => $decoded['summary']['valid'] ?? false,
                        'issues'         => count($decoded['summary']['issues'] ?? []) > 0
                            ? implode('; ', $decoded['summary']['issues']) : null,
                        'result'         => $decoded,
                    ]);

                    return response()->json(['ok' => true, 'status' => 'done', 'result' => $decoded]);
                }
            }
        }

        $jobId  = bin2hex(random_bytes(8));
        $dir    = storage_path('app/vrp/jobs');
        @mkdir($dir, 0775, true);
        $inPath  = "$dir/$jobId.in.json";
        $outPath = "$dir/$jobId.out.json";
        $errPath = "$dir/$jobId.err";
        file_put_contents($inPath, json_encode($data));

        $python = env('PYTHON_BIN', 'python3');
        $script = base_path('scripts/run_vrp.py');

        // Detached: survives the HTTP request, no time limit.
        // Capture the PID so we can kill it later if needed.
        $cmd = sprintf(
            'nohup %s %s < %s > %s 2> %s & echo $!',
            escapeshellarg($python),
            escapeshellarg($script),
            escapeshellarg($inPath),
            escapeshellarg($outPath),
            escapeshellarg($errPath),
        );
        $output = [];
        exec($cmd, $output);
        $pid = (int) ($output[0] ?? 0);
        
        // Store PID for later cleanup
        if ($pid > 0) {
            $pidPath = "$dir/$jobId.pid";
            file_put_contents($pidPath, (string) $pid);
        }

        return response()->json(['ok' => true, 'job_id' => $jobId]);
    }

    public function solveStatus(string $jobId): JsonResponse
    {
        if (! preg_match('/^[a-f0-9]{16}$/', $jobId)) {
            return response()->json(['ok' => false, 'error' => 'Invalid job id'], 400);
        }

        $dir     = storage_path('app/vrp/jobs');
        $outPath = "$dir/$jobId.out.json";
        $errPath = "$dir/$jobId.err";
        $inPath  = "$dir/$jobId.in.json";

        $errText = is_file($errPath) ? trim((string) file_get_contents($errPath)) : '';
        $outText = is_file($outPath) ? (string) file_get_contents($outPath) : '';

        if ($outText !== '') {
            $decoded = json_decode($outText, true);

            // If straight decode fails the output file may have debug text prepended
            // (e.g. QAOA progress lines written to stdout before the JSON result).
            // Find the first '{' and retry from there.
            if (! is_array($decoded)) {
                $jsonStart = strpos($outText, '{');
                if ($jsonStart !== false) {
                    $decoded = json_decode(substr($outText, $jsonStart), true);
                }
            }

            if (is_array($decoded)) {
                $input = is_file($inPath) ? json_decode(file_get_contents($inPath), true) : [];
                OptimizationHistory::create([
                    'user_id'        => auth()->id(),
                    'instance'       => $input['instance'] ?? 'unknown',
                    'k'              => $input['k'] ?? 0,
                    'algorithm'      => $input['algorithm'] ?? 'unknown',
                    'num_routes'     => $decoded['summary']['num_routes'] ?? 0,
                    'total_distance' => $decoded['summary']['total_distance'] ?? null,
                    'distance_std'   => $decoded['summary']['distance_std'] ?? null,
                    'elapsed'        => $decoded['summary']['elapsed'] ?? null,
                    'valid'          => $decoded['summary']['valid'] ?? false,
                    'issues'         => count($decoded['summary']['issues'] ?? []) > 0
                        ? implode('; ', $decoded['summary']['issues']) : null,
                    'result'         => $decoded,
                ]);

                return response()->json(['ok' => true, 'status' => 'done', 'result' => $decoded]);
            }
        }

        // Err file with no stdout → failure. Otherwise stderr is just QAOA progress.
        if ($errText !== '' && $outText === '' && ! $this->isRunning($jobId)) {
            return response()->json(['ok' => false, 'status' => 'failed', 'error' => $errText], 500);
        }

        return response()->json([
            'ok'       => true,
            'status'   => 'pending',
            'progress' => $this->extractProgress($errText),
        ]);
    }

    /**
     * Fetch debug output (stderr & stdout) from a solve job
     */
    public function solveDebug(string $jobId): JsonResponse
    {
        if (! preg_match('/^[a-f0-9]{16}$/', $jobId)) {
            return response()->json(['ok' => false, 'error' => 'Invalid job id'], 400);
        }

        $dir     = storage_path('app/vrp/jobs');
        $outPath = "$dir/$jobId.out.json";
        $errPath = "$dir/$jobId.err";

        $stderr = is_file($errPath) ? (string) file_get_contents($errPath) : '';
        $stdout = is_file($outPath) ? (string) file_get_contents($outPath) : '';

        return response()->json([
            'ok'     => true,
            'stderr' => $stderr,
            'stdout' => $stdout,
        ]);
    }

    /**
     * Stop a running optimization job (force kill)
     */
    public function stopJob(string $jobId): JsonResponse
    {
        if (! preg_match('/^[a-f0-9]{16}$/', $jobId)) {
            return response()->json(['ok' => false, 'error' => 'Invalid job id'], 400);
        }

        $dir    = storage_path('app/vrp/jobs');
        $pidPath = "$dir/$jobId.pid";
        $inPath  = "$dir/$jobId.in.json";

        // Attempt to read and kill the process
        if (is_file($pidPath)) {
            $pid = (int) trim(file_get_contents($pidPath));
            if ($pid > 0) {
                // Kill the process and any child processes
                @exec("kill -9 $pid 2>/dev/null");
                @exec("pkill -9 -P $pid 2>/dev/null"); // Kill children too
            }
            @unlink($pidPath);
        }

        // Mark job as stopped by removing the input file
        // (isRunning() checks if .in.json exists, so this signals completion)
        if (is_file($inPath)) {
            @unlink($inPath);
        }

        // Clean up any stderr/stdout if they exist
        $errPath = "$dir/$jobId.err";
        $outPath = "$dir/$jobId.out.json";
        if (! is_file($outPath)) {
            // Only append "stopped" message if no output yet
            file_put_contents($errPath, (is_file($errPath) ? file_get_contents($errPath) : '') . "\n[VRP] Job stopped by user", FILE_APPEND);
        }

        return response()->json(['ok' => true, 'message' => 'Job stopped']);
    }

    // ── Instance import ────────────────────────────────────────────────────

    public function importInstance(Request $request): JsonResponse
    {
        $request->validate([
            'file'  => ['required', 'file', 'max:20480'],
            'name'  => ['required', 'string', 'regex:/^[a-z0-9_-]{1,60}$/'],
            'depot' => ['sometimes', 'integer', 'min:0'],
        ]);

        $file     = $request->file('file');
        $name     = $request->input('name');
        $depotIdx = (int) $request->input('depot', 0);

        try {
            $ext    = strtolower($file->getClientOriginalExtension());
            $raw    = file_get_contents($file->getRealPath());
            $coords = $this->parseCoordinates($raw, $ext);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => 'Parse error: '.$e->getMessage()], 422);
        }

        if (count($coords) < 2) {
            return response()->json(['ok' => false, 'error' => 'Need at least 2 points (depot + 1 stop).'], 422);
        }
        if (count($coords) > 2000) {
            return response()->json(['ok' => false, 'error' => 'Maximum 2000 nodes per import.'], 422);
        }

        // Move depot to index 0.
        if ($depotIdx > 0 && $depotIdx < count($coords)) {
            $depot = array_splice($coords, $depotIdx, 1);
            array_unshift($coords, $depot[0]);
        }

        [$depot, $nodes, $dm, $bbox] = $this->buildInstance($coords);

        $label = ucwords(str_replace(['-', '_'], ' ', $name));
        $instance = [
            'label'       => $label,
            'latlng'      => true,
            'depot'       => $depot,
            'nodes'       => $nodes,
            'dist_matrix' => $dm,
            'bbox'        => $bbox,
        ];

        $dir  = base_path('scripts/instances');
        @mkdir($dir, 0775, true);
        file_put_contents("$dir/$name.json", json_encode($instance));

        return response()->json([
            'ok'    => true,
            'key'   => $name,
            'label' => $label,
            'size'  => count($nodes),
        ]);
    }

    public function deleteInstance(string $key): JsonResponse
    {
        if (! preg_match('/^[a-z0-9_-]{1,60}$/', $key)) {
            return response()->json(['ok' => false, 'error' => 'Invalid key'], 400);
        }
        $path = base_path("scripts/instances/$key.json");
        if (! file_exists($path)) {
            return response()->json(['ok' => false, 'error' => 'Not found'], 404);
        }
        unlink($path);
        return response()->json(['ok' => true]);
    }

    // ── Coordinate parsers ─────────────────────────────────────────────────

    private function parseCoordinates(string $raw, string $ext): array
    {
        return match ($ext) {
            'geojson'      => $this->parseGeoJson($raw),
            'kml', 'kmz'   => $this->parseKml($raw),
            'gpx'          => $this->parseGpx($raw),
            'json'         => $this->parseJsonCoords($raw),
            default        => $this->parseCsv($raw),   // csv / txt / tsv / fallback
        };
    }

    private function parseCsv(string $raw): array
    {
        $lines  = preg_split('/\r?\n/', trim($raw));
        $coords = [];
        $latIdx = 0;
        $lngIdx = 1;
        $first  = true;
        $header = [];

        // Extra recipient column indices
        $nameIdx  = null;
        $phoneIdx = null;
        $addrIdx  = null;
        $notesIdx = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;

            // Try comma, tab, semicolon
            $row = [$line];
            foreach ([',', "\t", ';'] as $sep) {
                if (substr_count($line, $sep) > 0) {
                    $row = str_getcsv($line, $sep);
                    break;
                }
            }

            if (count($row) < 2) continue;
            $row = array_map('trim', $row);

            // Header detection on first row
            if ($first) {
                $first = false;
                if (! is_numeric($row[0])) {
                    $header   = array_map('strtolower', $row);
                    $latIdx   = array_search('lat', $header)   !== false ? array_search('lat', $header)   : (array_search('latitude', $header)  !== false ? array_search('latitude', $header)  : 0);
                    $lngIdx   = array_search('lng', $header)   !== false ? array_search('lng', $header)   : (array_search('lon', $header)       !== false ? array_search('lon', $header)       : (array_search('longitude', $header) !== false ? array_search('longitude', $header) : 1));
                    $nameIdx  = array_search('recipient_name', $header)  !== false ? array_search('recipient_name', $header)  : (array_search('name', $header)  !== false ? array_search('name', $header)  : null);
                    $phoneIdx = array_search('recipient_phone', $header) !== false ? array_search('recipient_phone', $header) : (array_search('phone', $header) !== false ? array_search('phone', $header) : null);
                    $addrIdx  = array_search('address', $header)         !== false ? array_search('address', $header)         : null;
                    $notesIdx = array_search('notes', $header)           !== false ? array_search('notes', $header)           : null;
                    continue;
                }
            }

            $lat = (float) ($row[$latIdx] ?? 0);
            $lng = (float) ($row[$lngIdx] ?? 0);

            // Swap if values look transposed
            if (abs($lat) > 90 || (abs($lng) <= 90 && abs($lat) > abs($lng))) {
                [$lat, $lng] = [$lng, $lat];
            }

            if ($lat === 0.0 && $lng === 0.0) continue;

            $entry = ['lat' => $lat, 'lng' => $lng];
            if ($nameIdx  !== null && isset($row[$nameIdx]))  $entry['recipient_name']  = $row[$nameIdx];
            if ($phoneIdx !== null && isset($row[$phoneIdx])) $entry['recipient_phone'] = $row[$phoneIdx];
            if ($addrIdx  !== null && isset($row[$addrIdx]))  $entry['address']         = $row[$addrIdx];
            if ($notesIdx !== null && isset($row[$notesIdx])) $entry['notes']           = $row[$notesIdx];

            $coords[] = $entry;
        }

        return $coords;
    }

    private function parseJsonCoords(string $raw): array
    {
        $data = json_decode($raw, true);
        if (! is_array($data)) return [];

        // GeoJSON passthrough
        if (isset($data['type']) && in_array($data['type'], ['FeatureCollection', 'GeometryCollection'])) {
            return $this->parseGeoJson($raw);
        }

        // Flat array of objects: [{lat,lng}, ...]
        if (isset($data[0]) && is_array($data[0])) {
            $coords = [];
            foreach ($data as $item) {
                $lat = $item['lat'] ?? $item['latitude']  ?? $item['y'] ?? null;
                $lng = $item['lng'] ?? $item['lon']       ?? $item['longitude'] ?? $item['x'] ?? null;
                if ($lat !== null && $lng !== null) {
                    $coords[] = ['lat' => (float) $lat, 'lng' => (float) $lng];
                }
            }
            return $coords;
        }

        // Single object with arrays: {lats:[...], lngs:[...]}
        $lats = $data['lats'] ?? $data['lat']  ?? $data['latitudes']  ?? null;
        $lngs = $data['lngs'] ?? $data['lng']  ?? $data['longitudes'] ?? $data['lons'] ?? null;
        if (is_array($lats) && is_array($lngs)) {
            $coords = [];
            foreach ($lats as $i => $lat) {
                $coords[] = ['lat' => (float) $lat, 'lng' => (float) ($lngs[$i] ?? 0)];
            }
            return $coords;
        }

        return [];
    }

    private function parseGeoJson(string $raw): array
    {
        $data    = json_decode($raw, true);
        $coords  = [];
        $features = $data['features'] ?? [];
        foreach ($features as $f) {
            $geom = $f['geometry'] ?? [];
            if (($geom['type'] ?? '') === 'Point' && isset($geom['coordinates'][1])) {
                $coords[] = ['lat' => (float) $geom['coordinates'][1], 'lng' => (float) $geom['coordinates'][0]];
            }
        }
        return $coords;
    }

    private function parseKml(string $raw): array
    {
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($raw);
        if (! $xml) return [];

        $coords = [];
        // Try namespaced and non-namespaced Placemark elements
        foreach (['//kml:Placemark', '//Placemark'] as $xp) {
            try {
                $xml->registerXPathNamespace('kml', 'http://www.opengis.net/kml/2.2');
                $items = $xml->xpath($xp) ?: [];
            } catch (\Throwable) {
                $items = [];
            }
            foreach ($items as $pm) {
                $cStr = (string) ($pm->Point->coordinates
                    ?? ($pm->xpath('.//coordinates')[0] ?? null)
                    ?? '');
                if ($cStr === '') continue;
                $parts = array_map('floatval', explode(',', trim($cStr)));
                if (count($parts) >= 2) {
                    $coords[] = ['lat' => $parts[1], 'lng' => $parts[0]];
                }
            }
            if ($coords) break;
        }
        return $coords;
    }

    private function parseGpx(string $raw): array
    {
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($raw);
        if (! $xml) return [];

        $coords = [];
        foreach ($xml->wpt ?? [] as $wpt) {
            $coords[] = ['lat' => (float) $wpt['lat'], 'lng' => (float) $wpt['lon']];
        }
        foreach ($xml->rte->rtept ?? [] as $pt) {
            $coords[] = ['lat' => (float) $pt['lat'], 'lng' => (float) $pt['lon']];
        }
        foreach ($xml->trk->trkseg->trkpt ?? [] as $pt) {
            $coords[] = ['lat' => (float) $pt['lat'], 'lng' => (float) $pt['lon']];
        }
        return $coords;
    }

    // ── Instance builder ───────────────────────────────────────────────────

    private function buildInstance(array $coords): array
    {
        $n     = count($coords);
        $depot = ['id' => 0, 'x' => $coords[0]['lng'], 'y' => $coords[0]['lat']];
        $nodes = [];
        $recipientFields = ['recipient_name', 'recipient_phone', 'address', 'notes'];
        for ($i = 1; $i < $n; $i++) {
            $node = ['id' => $i, 'x' => $coords[$i]['lng'], 'y' => $coords[$i]['lat'], 'demand' => 1.0];
            foreach ($recipientFields as $field) {
                if (isset($coords[$i][$field])) {
                    $node[$field] = $coords[$i][$field];
                }
            }
            $nodes[] = $node;
        }

        // Haversine distance matrix (km)
        $dm = [];
        for ($i = 0; $i < $n; $i++) {
            $dm[$i] = [];
            for ($j = 0; $j < $n; $j++) {
                $dm[$i][$j] = round($this->haversine(
                    $coords[$i]['lat'], $coords[$i]['lng'],
                    $coords[$j]['lat'], $coords[$j]['lng'],
                ), 5);
            }
        }

        $lats = array_column($coords, 'lat');
        $lngs = array_column($coords, 'lng');
        $pad  = 0.01;
        $bbox = [
            'south' => round(min($lats) - $pad, 6),
            'north' => round(max($lats) + $pad, 6),
            'west'  => round(min($lngs) - $pad, 6),
            'east'  => round(max($lngs) + $pad, 6),
        ];

        return [$depot, $nodes, $dm, $bbox];
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371.0;
        $dlat = deg2rad($lat2 - $lat1);
        $dlng = deg2rad($lng2 - $lng1);
        $a    = sin($dlat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dlng / 2) ** 2;
        return $R * 2 * asin(sqrt($a));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function isRunning(string $jobId): bool
    {
        return is_file(storage_path("app/vrp/jobs/$jobId.in.json"));
    }

    private function extractProgress(string $stderr): ?string
    {
        if ($stderr === '') return null;
        $lines = preg_split("/\r?\n/", trim($stderr));
        return mb_substr(end($lines) ?: '', 0, 140);
    }

    private function instances(): array
    {
        $list = array_values(self::BUILTIN_INSTANCES);

        // Keys already covered by BUILTIN_INSTANCES — skip in the filesystem scan.
        $builtinKeys = array_column(self::BUILTIN_INSTANCES, 'key');

        foreach (glob(base_path('scripts/instances/*.json')) as $file) {
            $key = pathinfo($file, PATHINFO_FILENAME);
            if (in_array($key, $builtinKeys, true)) {
                continue;
            }
            $json   = json_decode(file_get_contents($file), true) ?: [];
            $list[] = [
                'key'       => $key,
                'label'     => $json['label'] ?? ucfirst(str_replace('_', ' ', $key)),
                'size'      => count($json['nodes'] ?? []),
                'group'     => 'Custom',
                'deletable' => true,
            ];
        }

        return $list;
    }
}
