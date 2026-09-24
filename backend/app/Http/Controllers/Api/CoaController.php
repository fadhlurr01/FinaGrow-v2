<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoaAccount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CoaController extends Controller
{
    /**
     * Display a listing of the resource for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $accounts = CoaAccount::where('user_id', $user->id)
            ->orderBy('code', 'asc')
            ->get();

        // Map database fields to frontend camelCase if desired
        $formatted = $accounts->map(function ($acc) {
            return [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'type' => $acc->type,
                'description' => $acc->description ?? '',
                'parentAccountId' => $acc->parent_account_id ?? '',
                'openingBalance' => (float) $acc->opening_balance,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'total' => $accounts->count(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $parentAccountId = $request->input('parentAccountId') ?: $request->input('parent_account_id');
        $openingBalance = $request->input('openingBalance') !== null ? $request->input('openingBalance') : $request->input('opening_balance', 0);

        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:Asset,Liability,Equity,Revenue,Expense',
            'description' => 'nullable|string',
        ]);

        $customId = $request->input('id') ?: ('AC-' . strtoupper(Str::random(6)));

        $account = CoaAccount::create([
            'id' => $customId,
            'user_id' => $user->id,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
            'parent_account_id' => $parentAccountId,
            'opening_balance' => (float)$openingBalance,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun Chart of Accounts berhasil disimpan ke database.',
            'data' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'description' => $account->description ?? '',
                'parentAccountId' => $account->parent_account_id ?? '',
                'parent_account_id' => $account->parent_account_id ?? '',
                'openingBalance' => (float) $account->opening_balance,
                'opening_balance' => (float) $account->opening_balance,
            ]
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $account = CoaAccount::where('user_id', $user->id)->where('id', $id)->first();

        if (!$account) {
            return response()->json(['error' => 'Akun COA tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'description' => $account->description ?? '',
                'parentAccountId' => $account->parent_account_id ?? '',
                'parent_account_id' => $account->parent_account_id ?? '',
                'openingBalance' => (float) $account->opening_balance,
                'opening_balance' => (float) $account->opening_balance,
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $account = CoaAccount::where('user_id', $user->id)->where('id', $id)->first();

        if (!$account) {
            return response()->json(['error' => 'Akun COA tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50',
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|in:Asset,Liability,Equity,Revenue,Expense',
            'description' => 'nullable|string',
        ]);

        $updateData = [];
        if ($request->has('code')) $updateData['code'] = $validated['code'];
        if ($request->has('name')) $updateData['name'] = $validated['name'];
        if ($request->has('type')) $updateData['type'] = $validated['type'];
        if ($request->has('description')) $updateData['description'] = $validated['description'];
        if ($request->has('parentAccountId') || $request->has('parent_account_id')) {
            $updateData['parent_account_id'] = $request->input('parentAccountId') ?: $request->input('parent_account_id');
        }
        if ($request->has('openingBalance') || $request->has('opening_balance')) {
            $updateData['opening_balance'] = (float)($request->input('openingBalance') !== null ? $request->input('openingBalance') : $request->input('opening_balance'));
        }

        $account->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Akun Chart of Accounts berhasil diperbarui.',
            'data' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'description' => $account->description ?? '',
                'parentAccountId' => $account->parent_account_id ?? '',
                'parent_account_id' => $account->parent_account_id ?? '',
                'openingBalance' => (float) $account->opening_balance,
                'opening_balance' => (float) $account->opening_balance,
            ]
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $account = CoaAccount::where('user_id', $user->id)->where('id', $id)->first();

        if (!$account) {
            return response()->json(['error' => 'Akun COA tidak ditemukan.'], 404);
        }

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun Chart of Accounts berhasil dihapus dari database.'
        ]);
    }
}
