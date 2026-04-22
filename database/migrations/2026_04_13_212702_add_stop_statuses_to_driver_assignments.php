<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds per-stop delivery tracking to driver_assignments.
     *
     * stop_statuses is a JSON array indexed by stop position (0-based),
     * each element: { status, notes, recorded_at }
     */
    public function up(): void
    {
        Schema::table('driver_assignments', function (Blueprint $table) {
            // Per-stop delivery records: [{ status, notes, recorded_at }, ...]
            $table->json('stop_statuses')->nullable()->after('stops');
        });
    }

    public function down(): void
    {
        Schema::table('driver_assignments', function (Blueprint $table) {
            $table->dropColumn('stop_statuses');
        });
    }
};
