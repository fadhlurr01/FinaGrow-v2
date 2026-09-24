<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * Display a listing of team users.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::with('subscriptions')->orderBy('id', 'asc')->get();

        $formatted = $users->map(function ($u) {
            $emailLower = strtolower($u->email ?? '');
            $isAdmin = in_array(strtolower($u->role), ['admin', 'owner']) || $emailLower === 'demo_admin@fms.com';
            $activeSub = $u->subscriptions->sortByDesc('id')->first();
            $planName = $u->is_pro || $isAdmin ? 'Pro Plan' : ($activeSub && $activeSub->plan === 'Enterprise' ? 'Enterprise Plan' : 'Free Plan');

            return [
                'id' => (string)$u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone ?? '',
                'role' => ucfirst($u->role),
                'subscription' => $planName,
                'status' => $u->is_banned ? 'Suspended' : 'Active',
                'createdAt' => $u->created_at ? $u->created_at->toIso8601String() : null,
                'avatar' => $u->avatar ?? '',
                'job_title' => $u->job_title ?? '',
                'department' => $u->department ?? '',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'count' => $formatted->count(),
        ]);
    }

    /**
     * Store a newly created team user.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:25',
            'role' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $role = strtolower($request->input('role', 'user'));
        $isPro = in_array($role, ['admin', 'owner', 'manager']);
        $isBanned = in_array(strtolower($request->input('status', '')), ['suspended', 'banned']);

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'phone' => $request->phone ? trim($request->phone) : null,
            'password' => Hash::make($request->input('password', 'password123')),
            'role' => $role,
            'is_pro' => $isPro,
            'is_banned' => $isBanned,
            'api_token' => Str::random(60),
        ]);

        // Auto create subscription
        Subscription::create([
            'user_id' => $user->id,
            'plan' => $isPro ? 'Pro' : 'Free',
            'status' => 'active',
            'price' => $isPro ? 450000 : 0,
            'start_date' => now(),
            'end_date' => now()->addYear(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => [
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'role' => ucfirst($user->role),
                'subscription' => $isPro ? 'Pro Plan' : 'Free Plan',
                'status' => $user->is_banned ? 'Suspended' : 'Active',
                'createdAt' => $user->created_at->toIso8601String(),
            ]
        ], 201);
    }

    /**
     * Update existing user.
     */
    public function update(Request $request, $id = null): JsonResponse
    {
        $targetId = $id ?: $request->input('id') ?: $request->query('id');
        $user = User::find($targetId);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        if ($request->has('name') && !empty($request->name)) {
            $user->name = trim($request->name);
        }

        if ($request->has('phone')) {
            $user->phone = trim($request->phone);
        }

        if ($request->has('role') && !empty($request->role)) {
            $user->role = strtolower($request->role);
            if (in_array($user->role, ['admin', 'owner'])) {
                $user->is_pro = true;
            }
        }

        if ($request->has('status')) {
            $user->is_banned = in_array(strtolower($request->status), ['suspended', 'banned']);
        }

        if ($request->has('password') && strlen($request->password) >= 6) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => [
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'role' => ucfirst($user->role),
                'subscription' => $user->is_pro ? 'Pro Plan' : 'Free Plan',
                'status' => $user->is_banned ? 'Suspended' : 'Active',
            ]
        ]);
    }

    /**
     * Delete user from system.
     */
    public function destroy(Request $request, $id = null): JsonResponse
    {
        $targetId = $id ?: $request->input('id') ?: $request->query('id');
        $user = User::find($targetId);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        // Protect primary demo admin
        if ($user->email === 'demo_admin@fms.com' || $user->email === 'demo@finagrow.com') {
            return response()->json(['success' => false, 'message' => 'System account cannot be deleted'], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully from database'
        ]);
    }
}
