<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_id')->unique();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('todo_id')->nullable();
            $table->string('action', 64);
            $table->string('message', 255);
            $table->string('request_id', 191);
            $table->string('subject_email')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('todo_id');
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logs');
    }
};
