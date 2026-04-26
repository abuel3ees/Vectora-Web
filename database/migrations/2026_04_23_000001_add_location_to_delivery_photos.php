<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add location fields to delivery_photos table for location verification.
     * Captures driver's location when photo is taken to verify they were at the stop.
     */
    public function up(): void
    {
        Schema::table('delivery_photos', function (Blueprint $table) {
            // Location where photo was taken
            $table->double('photo_lat')->nullable()->after('notes');
            $table->double('photo_lng')->nullable()->after('photo_lat');
            
            // Expected stop location (denormalized for quick comparison)
            $table->double('stop_lat')->nullable()->after('photo_lng');
            $table->double('stop_lng')->nullable()->after('stop_lat');
            
            // Distance in meters between photo location and stop location
            $table->double('location_distance_m')->nullable()->after('stop_lng');
            
            // Whether photo was taken at stop location (within 50m threshold)
            $table->boolean('location_verified')->default(false)->after('location_distance_m');
            
            // Timestamp when photo was captured (from device)
            $table->timestamp('photo_taken_at')->nullable()->after('location_verified');
            
            // Index for location verification queries
            $table->index(['driver_assignment_id', 'location_verified']);
        });
    }

    public function down(): void
    {
        Schema::table('delivery_photos', function (Blueprint $table) {
            $table->dropIndex(['driver_assignment_id', 'location_verified']);
            $table->dropColumn([
                'photo_lat',
                'photo_lng',
                'stop_lat',
                'stop_lng',
                'location_distance_m',
                'location_verified',
                'photo_taken_at',
            ]);
        });
    }
};
