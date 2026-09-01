<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle User Registration (Clean state, is_pro = false, 0 transactions).
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $apiToken = Str::random(60);

        $user = User::create([
            'name' => $request->name,
            'email' => strtolower(trim($request->email)),
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'is_pro' => false,
            'is_banned' => false,
            'api_token' => $apiToken,
        ]);

        // Create initial Free subscription
        Subscription::create([
            'user_id' => $user->id,
            'plan' => 'Free',
            'status' => 'active',
            'price' => 0,
            'start_date' => now(),
            'end_date' => now()->addYears(10),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Account initialized with clean data.',
            'token' => $apiToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_pro' => $user->is_pro,
                'subscription' => 'Free',
            ],
            'state' => [
                'transactions' => [],
                'assets' => [],
            ]
        ], 201);
    }

    /**
     * Handle User Login.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau kata sandi tidak sesuai.'
            ], 401);
        }

        if ($user->is_banned) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan / diblokir oleh administrator.'
            ], 403);
        }

        // Refresh or assign token
        if (!$user->api_token) {
            $user->api_token = Str::random(60);
            $user->save();
        }

        $subscription = $user->subscriptions()->latest()->first();

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $user->api_token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_pro' => (bool)$user->is_pro,
                'subscription' => $user->is_pro ? 'Pro' : ($subscription ? $subscription->plan : 'Free'),
            ]
        ]);
    }

    /**
     * Handle 1-Click Demo Login (role = demo, is_pro = true).
     */
    public function demoLogin()
    {
        $demoEmail = 'demo@finagrow.com';
        $user = User::where('email', $demoEmail)->first();

        if (!$user) {
            // Auto-create demo user if not yet seeded
            $user = User::create([
                'name' => 'FINAGROW Demo Enterprise',
                'email' => $demoEmail,
                'phone' => '081234567890',
                'password' => Hash::make('demopassword123'),
                'role' => 'demo',
                'is_pro' => true,
                'is_banned' => false,
                'api_token' => Str::random(60),
            ]);

            Subscription::create([
                'user_id' => $user->id,
                'plan' => 'Pro',
                'status' => 'active',
                'price' => 450000,
                'start_date' => now(),
                'end_date' => now()->addYear(),
            ]);

            // Seed demo transactions
            \Database\Seeders\DemoUserSeeder::seedDemoDataForUser($user);
        } else {
            // Ensure demo user is Pro and active
            $user->is_pro = true;
            $user->role = 'demo';
            if (!$user->api_token) {
                $user->api_token = Str::random(60);
            }
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Demo mode active. Loaded pre-populated enterprise data.',
            'token' => $user->api_token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => 'demo',
                'is_pro' => true,
                'subscription' => 'Pro',
            ]
        ]);
    }

    /**
     * Get Current Authenticated User Profile.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $subscription = $user->subscriptions()->latest()->first();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_pro' => (bool)$user->is_pro,
                'subscription' => $user->is_pro ? 'Pro' : ($subscription ? $subscription->plan : 'Free'),
            ]
        ]);
    }

    /**
     * Logout.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->api_token = null;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out'
        ]);
    }
}
