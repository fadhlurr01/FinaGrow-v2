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
        Schema::create('coa_accounts', function (Blueprint $table) {
            $table->string('id')->primary(); // Custom string IDs e.g. AC_1001, COA-12345
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('code');
            $table->string('name');
            $table->string('type')->default('Asset'); // Asset, Liability, Equity, Revenue, Expense
            $table->text('description')->nullable();
            $table->string('parent_account_id')->nullable();
            $table->decimal('opening_balance', 18, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coa_accounts');
    }
};
