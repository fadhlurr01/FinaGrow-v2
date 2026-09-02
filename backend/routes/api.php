<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\CoaController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Middleware\AuthenticateApiToken;

/*
|--------------------------------------------------------------------------
| API Routes for FINAGROW
|--------------------------------------------------------------------------
*/

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'online',
        'system' => 'FINAGROW API Engine',
        'timestamp' => now()->toIso8601String()
    ]);
});

// Authentication Routes (Public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/demo-login', [AuthController::class, 'demoLogin']);

// Authenticated Routes (Protected by Bearer Token)
Route::middleware(AuthenticateApiToken::class)->group(function () {
    // Current User Profile & Logout
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Financial Transactions CRUD & Metrics
    Route::get('/transactions/summary', [TransactionController::class, 'summary']);
    Route::apiResource('transactions', TransactionController::class);

    // Assets Management CRUD
    Route::apiResource('assets', AssetController::class);

    // Chart of Accounts (COA) Management CRUD
    Route::apiResource('coa', CoaController::class);

    // Subscriptions & Pro Upgrade
    Route::get('/subscription/current', [SubscriptionController::class, 'current']);
    Route::post('/subscription/upgrade', [SubscriptionController::class, 'upgrade']);
});
