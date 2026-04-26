<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'status', 'description'])]
class DispatchRoute extends Model
{
    /**
     * Get all driver assignments for this dispatch route
     * Links via the instance field (route name)
     */
    public function assignments()
    {
        return DriverAssignment::where('instance', $this->name)
            ->with('driver')
            ->get();
    }
}
