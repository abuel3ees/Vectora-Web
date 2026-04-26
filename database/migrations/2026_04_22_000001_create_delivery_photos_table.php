<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Creates delivery_photos table for storing driver-uploaded delivery photos.
     * Each row represents one photo for a specific stop on a route assignment.
     */
    public function up(): void
    {
        Schema::create('delivery_photos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('driver_assignment_id');
            $table->integer('stop_raw_index'); // 0-based index into the stops array
            $table->string('photo_url'); // Path or URL where photo is stored
            $table->text('notes')->nullable(); // Optional notes/comments from driver
            $table->timestamp('uploaded_at')->nullable(); // When the photo was uploaded
            $table->timestamps();

            // Foreign key to driver_assignments
            $table->foreign('driver_assignment_id')
                ->references('id')
                ->on('driver_assignments')
                ->onDelete('cascade');

            // Index for fast lookup by assignment + stop
            $table->index(['driver_assignment_id', 'stop_raw_index']);
            // Index for lookups by assignment alone
            $table->index('driver_assignment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_photos');
    }
};
