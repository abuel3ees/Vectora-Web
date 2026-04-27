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

    public function show(): Response
    {
        $drivers = User::role('driver')
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->toArray();

        $history = OptimizationHistory::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->toArray();

        return Inertia::render('optimize/index', [
            'instances'   => $this->instances(),
            'algorithms'  => self::ALGORITHMS,
            'mapboxToken' => config('services.mapbox.token'),
            'drivers'     => $drivers,
            'history'     => $history,
        ]);
    }

    public function history(): Response
    {
        $history = OptimizationHistory::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->paginate(50);

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
        $cmd = sprintf(
            'nohup %s %s < %s > %s 2> %s &',
            escapeshellarg($python),
            escapeshellarg($script),
            escapeshellarg($inPath),
            escapeshellarg($outPath),
            escapeshellarg($errPath),
        );
        exec($cmd);

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
                // Save to optimization history
                $input = is_file($inPath) ? json_decode(file_get_contents($inPath), true) : [];
                OptimizationHistory::create([
                    'user_id'       => auth()->id(),
                    'instance'      => $input['instance'] ?? 'unknown',
                    'k'             => $input['k'] ?? 0,
                    'algorithm'     => $input['algorithm'] ?? 'unknown',
                    'num_routes'    => $decoded['summary']['num_routes'] ?? 0,
                    'total_distance' => $decoded['summary']['total_distance'] ?? null,
                    'distance_std'  => $decoded['summary']['distance_std'] ?? null,
                    'elapsed'       => $decoded['summary']['elapsed'] ?? null,
                    'valid'         => $decoded['summary']['valid'] ?? false,
                    'issues'        => count($decoded['summary']['issues'] ?? []) > 0 ? implode('; ', $decoded['summary']['issues']) : null,
                    'result'        => $decoded,
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

    private function isRunning(string $jobId): bool
    {
        $inPath = storage_path("app/vrp/jobs/$jobId.in.json");
        // Rough liveness: input file still there and no output yet ≈ still running.
        // Good enough for our single-host case.
        return is_file($inPath);
    }

    private function extractProgress(string $stderr): ?string
    {
        if ($stderr === '') {
            return null;
        }
        $lines = preg_split("/\r?\n/", trim($stderr));
        $last  = end($lines) ?: '';
        return mb_substr($last, 0, 140);
    }

    private function instances(): array
    {
        $list = [
            ['key' => '50',   'label' => 'Rio Claro Post · 50 stops',   'size' => 50],
            ['key' => '100',  'label' => 'Rio Claro Post · 100 stops',  'size' => 100],
            ['key' => '200',  'label' => 'Rio Claro Post · 200 stops',  'size' => 200],
            ['key' => '500',  'label' => 'Rio Claro Post · 500 stops',  'size' => 500],
            ['key' => '1000', 'label' => 'Rio Claro Post · 1000 stops', 'size' => 1000],
            ['key' => 'rioclaro', 'label' => 'Rio Claro · Maison benchmark', 'size' => 50],
        ];

        foreach (glob(base_path('scripts/instances/*.json')) as $file) {
            $key = pathinfo($file, PATHINFO_FILENAME);
            $json = json_decode(file_get_contents($file), true) ?: [];
            $list[] = [
                'key'   => $key,
                'label' => $json['label'] ?? ucfirst($key),
                'size'  => count($json['nodes'] ?? []),
            ];
        }
        return $list;
    }
}
