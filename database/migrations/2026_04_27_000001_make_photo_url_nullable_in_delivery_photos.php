<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_photos', function (Blueprint $table) {
            // Allow null so signature-only records can exist without a photo
            $table->string('photo_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('delivery_photos', function (Blueprint $table) {
            $table->string('photo_url')->nullable(false)->change();
        });
    }
};
