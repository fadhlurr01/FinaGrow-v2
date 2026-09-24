<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'FINAGROW Backend API',
        'status' => 'online',
        'documentation' => 'Akses endpoint API di /api'
    ]);
});
