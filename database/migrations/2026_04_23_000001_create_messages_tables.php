<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispatcher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assignment_id')->nullable()->constrained('driver_assignments')->onDelete('cascade');
            $table->text('content');
            $table->enum('type', ['instruction', 'alert', 'note'])->default('instruction');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['assignment_id', 'is_read']);
            $table->index('created_at');
        });

        Schema::create('message_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('message_id')->nullable()->constrained('messages')->onDelete('cascade');
            $table->boolean('queued_locally')->default(false);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            
            $table->index(['driver_id', 'delivered_at']);
        });

        Schema::table('delivery_photos', function (Blueprint $table) {
            if (!Schema::hasColumn('delivery_photos', 'signature_url')) {
                $table->string('signature_url')->nullable()->after('photo_url');
            }
            if (!Schema::hasColumn('delivery_photos', 'signature_captured_at')) {
                $table->timestamp('signature_captured_at')->nullable()->after('signature_url');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_notifications');
        Schema::dropIfExists('messages');
        
        Schema::table('delivery_photos', function (Blueprint $table) {
            $table->dropColumn(['signature_url', 'signature_captured_at']);
        });
    }
};
