<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds street-snapped route geometry to driver_assignments.
     *
     * geometry stores the GeoJSON LineString coordinates array from OSMnx:
     * [[lng, lat], [lng, lat], ...]  (standard GeoJSON order)
     */
    public function up(): void
    {
        Schema::table('driver_assignments', function (Blueprint $table) {
            $table->json('geometry')->nullable()->after('stop_statuses');
        });
    }

    public function down(): void
    {
        Schema::table('driver_assignments', function (Blueprint $table) {
            $table->dropColumn('geometry');
        });
    }
};
