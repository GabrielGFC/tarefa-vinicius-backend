<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],
    'allowed_origins' => [env('CORS_ORIGIN', 'http://localhost:5500')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'X-Internal-Token'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
