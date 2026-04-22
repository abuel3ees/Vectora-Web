<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverAssignment extends Model
{
    protected $fillable = [
        'driver_id', 'instance', 'algorithm', 'vehicle_index', 'color',
        'total_distance', 'num_stops', 'stops', 'status',
        'assigned_at', 'accepted_at', 'completed_at',
    ];

    protected $casts = [
        'stops'         => 'array',
        'assigned_at'   => 'datetime',
        'accepted_at'   => 'datetime',
        'completed_at'  => 'datetime',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
