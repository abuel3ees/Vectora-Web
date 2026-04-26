<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverLocation extends Model
{
    protected $fillable = [
        'driver_assignment_id',
        'latitude',
        'longitude',
        'accuracy',
        'speed',
        'heading',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    /**
     * Relationship to DriverAssignment
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(DriverAssignment::class, 'driver_assignment_id');
    }

    /**
     * Scope: Get all locations for a specific assignment
     */
    public function scopeForAssignment($query, int $assignmentId)
    {
        return $query->where('driver_assignment_id', $assignmentId);
    }

    /**
     * Scope: Get the most recent location for each assignment
     */
    public function scopeLatestPerAssignment($query)
    {
        return $query->latest('recorded_at')
                     ->distinct('driver_assignment_id');
    }
}
