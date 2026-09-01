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
        Schema::create('assets', function (Blueprint $table) {
            $table->string('id')->primary(); // Supports string UUID/custom IDs e.g. AST-XXXX
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('category')->default('Equipment');
            $table->date('purchase_date');
            $table->decimal('purchase_cost', 18, 2)->default(0);
            $table->integer('useful_life')->default(5); // In years
            $table->string('depreciation_method')->default('Straight Line');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
