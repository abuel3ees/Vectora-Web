<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('optimization_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('instance');
            $table->integer('k');
            $table->string('algorithm');
            $table->integer('num_routes');
            $table->float('total_distance')->nullable();
            $table->float('distance_std')->nullable();
            $table->float('elapsed')->nullable();
            $table->boolean('valid');
            $table->text('issues')->nullable();
            $table->json('result')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('optimization_histories');
    }
};
