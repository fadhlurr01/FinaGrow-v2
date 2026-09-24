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
                'avatar' => $user->avatar ?? '',
                'job_title' => $user->job_title ?? '',
                'department' => $user->department ?? '',
                'cost_center' => $user->cost_center ?? '',
                'employee_id' => $user->employee_id ?? '',
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
                'avatar' => $user->avatar ?? '',
                'job_title' => $user->job_title ?? '',
                'department' => $user->department ?? '',
                'cost_center' => $user->cost_center ?? '',
                'employee_id' => $user->employee_id ?? '',
            ]
        ]);
    }

    /**
     * Handle 1-Click Demo Login (role = admin / user).
     */
    public function demoLogin(Request $request)
    {
        $requestedRole = strtolower($request->input('role', 'admin'));
        $requestedEmail = strtolower(trim($request->input('email', '')));

        if ($requestedRole === 'user' || $requestedEmail === 'demo_user@fms.com') {
            $demoEmail = 'demo_user@fms.com';
            $defaultName = 'Demo User';
            $role = 'user';
            $isPro = false;
        } else {
            $demoEmail = 'demo_admin@fms.com';
            $defaultName = 'Demo Admin';
            $role = 'admin';
            $isPro = true;
        }

        $user = User::where('email', $demoEmail)->first();

        if (!$user) {
            $user = User::create([
                'name' => $defaultName,
                'email' => $demoEmail,
                'phone' => $role === 'admin' ? '08123456781' : '08123456782',
                'password' => Hash::make('123456'),
                'role' => $role,
                'is_pro' => $isPro,
                'is_banned' => false,
                'api_token' => Str::random(60),
                'job_title' => $role === 'admin' ? 'Senior Financial Controller' : 'Associate Analyst',
                'department' => $role === 'admin' ? 'Finance & Treasury' : 'Operations',
                'cost_center' => $role === 'admin' ? 'CC-ID-JAB-204' : 'CC-ID-JKT-101',
                'employee_id' => $role === 'admin' ? 'EMP-98839211' : 'EMP-44219082',
            ]);

            Subscription::create([
                'user_id' => $user->id,
                'plan' => $isPro ? 'Pro' : 'Free',
                'status' => 'active',
                'price' => $isPro ? 450000 : 0,
                'start_date' => now(),
                'end_date' => $isPro ? now()->addYear() : null,
            ]);

            if ($role === 'admin') {
                \Database\Seeders\DemoUserSeeder::seedExactEnterpriseTransactions($user, 'JE');
            } else {
                \Database\Seeders\DemoUserSeeder::seedExactRetailUserTransactions($user, 'JU');
            }
        } else {
            if (!$user->api_token) {
                $user->api_token = Str::random(60);
                $user->save();
            }
        }

        $subscription = $user->subscriptions()->latest()->first();

        return response()->json([
            'success' => true,
            'message' => 'Demo mode active. Loaded database records.',
            'token' => $user->api_token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_pro' => (bool)$user->is_pro,
                'subscription' => $user->is_pro ? 'Pro' : ($subscription ? $subscription->plan : 'Free'),
                'avatar' => $user->avatar ?? '',
                'job_title' => $user->job_title ?? '',
                'department' => $user->department ?? '',
                'cost_center' => $user->cost_center ?? '',
                'employee_id' => $user->employee_id ?? '',
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
                'avatar' => $user->avatar ?? '',
                'job_title' => $user->job_title ?? '',
                'department' => $user->department ?? '',
                'cost_center' => $user->cost_center ?? '',
                'employee_id' => $user->employee_id ?? '',
            ]
        ]);
    }

    /**
     * Update Profile in database.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        if ($request->has('name') && !empty($request->name)) {
            $user->name = trim($request->name);
        }
        if ($request->has('phone')) {
            $user->phone = trim($request->phone);
        }
        if ($request->has('avatar')) {
            $user->avatar = $request->avatar;
        }
        if ($request->has('job_title') || $request->has('jobTitle')) {
            $user->job_title = $request->input('job_title') ?: $request->input('jobTitle');
        }
        if ($request->has('department')) {
            $user->department = $request->department;
        }
        if ($request->has('cost_center') || $request->has('costCenter')) {
            $user->cost_center = $request->input('cost_center') ?: $request->input('costCenter');
        }
        if ($request->has('employee_id') || $request->has('employeeId')) {
            $user->employee_id = $request->input('employee_id') ?: $request->input('employeeId');
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui di database.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_pro' => (bool)$user->is_pro,
                'avatar' => $user->avatar ?? '',
                'job_title' => $user->job_title ?? '',
                'department' => $user->department ?? '',
                'cost_center' => $user->cost_center ?? '',
                'employee_id' => $user->employee_id ?? '',
            ]
        ]);
    }

    /**
     * Change Password in database.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini tidak cocok.'
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.'
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
