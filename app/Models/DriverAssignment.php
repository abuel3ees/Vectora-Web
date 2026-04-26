<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DriverAssignment extends Model
{
    protected $fillable = [
        'driver_id', 'instance', 'algorithm', 'vehicle_index', 'color',
        'total_distance', 'num_stops', 'stops', 'stop_statuses', 'geometry',
        'status', 'assigned_at', 'accepted_at', 'completed_at',
    ];

    protected $casts = [
        'stops'         => 'array',
        'stop_statuses' => 'array',
        'geometry'      => 'array',
        'assigned_at'   => 'datetime',
        'accepted_at'   => 'datetime',
        'completed_at'  => 'datetime',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    /**
     * Relationship to delivery photos
     */
    public function photos(): HasMany
    {
        return $this->hasMany(DeliveryPhoto::class, 'driver_assignment_id');
    }

    /**
     * Relationship to driver locations
     */
    public function locations(): HasMany
    {
        return $this->hasMany(DriverLocation::class, 'driver_assignment_id');
    }

    /**
     * Latest location sample for this assignment.
     */
    public function latestLocation(): HasOne
    {
        return $this->hasOne(DriverLocation::class, 'driver_assignment_id')->latestOfMany('recorded_at');
    }
}
