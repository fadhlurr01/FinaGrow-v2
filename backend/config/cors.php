<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://finagrow.kembangin.online',
        'http://finagrow.kembangin.online',
        'https://api-finagrow.kembangin.online',
        'http://api-finagrow.kembangin.online',
        env('FRONTEND_URL', 'https://finagrow.kembangin.online'),
        // Support vercel or custom subdomains
        'https://*.vercel.app',
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.kembangin\.online$#',
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Authorization', 'X-API-TOKEN'],

    'max_age' => 0,

    'supports_credentials' => true,

];
