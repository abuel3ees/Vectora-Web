<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OptimizationHistory extends Model
{
    protected $fillable = [
        'user_id',
        'instance',
        'k',
        'algorithm',
        'num_routes',
        'total_distance',
        'distance_std',
        'elapsed',
        'valid',
        'issues',
        'result',
    ];

    protected $casts = [
        'result' => 'array',
        'valid' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
