<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryPhoto extends Model
{
    protected $fillable = [
        'driver_assignment_id',
        'stop_raw_index',
        'photo_url',
        'notes',
        'photo_lat',
        'photo_lng',
        'stop_lat',
        'stop_lng',
        'location_distance_m',
        'location_verified',
        'photo_taken_at',
        'uploaded_at',
    ];

    protected $casts = [
        'photo_lat'           => 'float',
        'photo_lng'           => 'float',
        'stop_lat'            => 'float',
        'stop_lng'            => 'float',
        'location_distance_m' => 'float',
        'location_verified'   => 'boolean',
        'photo_taken_at'      => 'datetime',
        'uploaded_at'         => 'datetime',
        'created_at'          => 'datetime',
        'updated_at'          => 'datetime',
    ];

    /**
     * Relationship to DriverAssignment
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(DriverAssignment::class, 'driver_assignment_id');
    }

    /**
     * Scope: Get all photos for a specific assignment
     */
    public function scopeForAssignment($query, int $assignmentId)
    {
        return $query->where('driver_assignment_id', $assignmentId);
    }

    /**
     * Scope: Get all photos for a specific stop on an assignment
     */
    public function scopeForStop($query, int $assignmentId, int $stopIndex)
    {
        return $query->where('driver_assignment_id', $assignmentId)
                     ->where('stop_raw_index', $stopIndex);
    }
}
