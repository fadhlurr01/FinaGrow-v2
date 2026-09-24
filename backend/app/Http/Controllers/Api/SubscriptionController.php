<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Get current user's subscription details.
     */
    public function current(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $subscription = $user->subscriptions()->latest()->first();

        return response()->json([
            'success' => true,
            'data' => [
                'is_pro' => (bool)$user->is_pro,
                'plan' => $user->is_pro ? 'Pro' : ($subscription ? $subscription->plan : 'Free'),
                'status' => $subscription ? $subscription->status : 'active',
                'price' => $subscription ? (float)$subscription->price : 0,
                'start_date' => $subscription ? $subscription->start_date : null,
                'end_date' => $subscription ? $subscription->end_date : null,
            ]
        ]);
    }

    /**
     * Upgrade subscription to Pro plan.
     */
    public function upgrade(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $plan = $request->input('plan', 'Pro');
        $price = $plan === 'Enterprise' ? 1500000 : 450000;

        $user->is_pro = true;
        $user->save();

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan' => $plan,
            'status' => 'active',
            'price' => $price,
            'start_date' => now(),
            'end_date' => now()->addMonth(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Selamat! Akun Anda berhasil di-upgrade ke paket {$plan}.",
            'data' => [
                'is_pro' => true,
                'plan' => $plan,
                'subscription' => $subscription
            ]
        ]);
    }
}
