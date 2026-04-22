<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
            $table->string('instance');
            $table->string('algorithm');
            $table->unsignedSmallInteger('vehicle_index');
            $table->string('color', 16)->nullable();
            $table->float('total_distance')->nullable();
            $table->unsignedSmallInteger('num_stops')->nullable();
            // Ordered list of stops: [{node_id, lat, lng, is_depot}]
            $table->json('stops');
            $table->string('status')->default('pending'); // pending|accepted|in_progress|completed|cancelled
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['driver_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_assignments');
    }
};
