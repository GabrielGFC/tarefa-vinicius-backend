<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInternalToken
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $expectedToken = (string) env('INTERNAL_TOKEN', 'change-me-internal-token');
        $receivedToken = (string) $request->header('X-Internal-Token', '');

        if ($expectedToken === '' || ! hash_equals($expectedToken, $receivedToken)) {
            return response()->json([
                'message' => 'Unauthorized internal request',
            ], 401);
        }

        return $next($request);
    }
}
