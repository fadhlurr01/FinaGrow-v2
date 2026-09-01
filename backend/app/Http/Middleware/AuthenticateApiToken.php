<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            $token = $request->header('X-API-TOKEN') ?: $request->input('api_token');
        }

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Token autentikasi tidak ditemukan.'
            ], 401);
        }

        $user = User::where('api_token', $token)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Token tidak valid atau sesi telah berakhir.'
            ], 401);
        }

        if ($user->is_banned) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden: Akun Anda telah dinonaktifkan.'
            ], 403);
        }

        // Attach authenticated user to request
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }
}
