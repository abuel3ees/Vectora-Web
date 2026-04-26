<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_locations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('driver_assignment_id');
            $table->decimal('latitude', 10, 8); // Range: -90 to 90
            $table->decimal('longitude', 11, 8); // Range: -180 to 180
            $table->float('accuracy')->nullable(); // In meters
            $table->float('speed')->nullable(); // In m/s
            $table->unsignedSmallInteger('heading')->nullable(); // 0-360 degrees
            $table->timestamp('recorded_at'); // When GPS was captured (from device timestamp)
            $table->timestamps();

            // Foreign key
            $table->foreign('driver_assignment_id')
                ->references('id')
                ->on('driver_assignments')
                ->onDelete('cascade');

            // Indexes
            $table->index('driver_assignment_id');
            $table->index(['driver_assignment_id', 'recorded_at']);
            $table->index('recorded_at'); // For time-range queries
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_locations');
    }
};
