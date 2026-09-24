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
        Schema::create('transactions', function (Blueprint $table) {
            $table->string('id')->primary(); // Supports string UUID/custom IDs e.g. TX-XXXXXX
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('description');
            $table->decimal('amount', 18, 2)->default(0);
            $table->date('date');
            $table->enum('type', ['income', 'expense'])->default('income');
            $table->string('category')->default('General');
            $table->enum('status', ['Completed', 'Pending', 'Cancelled'])->default('Completed');
            $table->string('vendor')->nullable();
            $table->string('customer')->nullable();
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->string('entity')->default('E1');
            $table->string('dr')->nullable();
            $table->string('cr')->nullable();
            $table->string('cur', 10)->default('IDR');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
