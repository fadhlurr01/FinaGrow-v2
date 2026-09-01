<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AssetController extends Controller
{
    /**
     * Display a listing of assets for authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $assets = Asset::where('user_id', $user->id)
                       ->orderBy('purchase_date', 'desc')
                       ->get();

        return response()->json([
            'success' => true,
            'data' => $assets,
            'total_valuation' => (float)$assets->sum('purchase_cost')
        ]);
    }

    /**
     * Store a newly created asset.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'purchase_date' => 'required|date',
            'purchase_cost' => 'required|numeric|min:0',
            'useful_life' => 'nullable|integer|min:1',
            'depreciation_method' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $customId = $request->input('id') ?: 'AST-' . strtoupper(Str::random(6));

        $asset = Asset::create([
            'id' => $customId,
            'user_id' => $user->id,
            'code' => $request->code ?: 'AST-' . rand(100, 999),
            'name' => $request->name,
            'category' => $request->category ?: 'Equipment',
            'purchase_date' => $request->purchase_date,
            'purchase_cost' => $request->purchase_cost,
            'useful_life' => $request->useful_life ?: 5,
            'depreciation_method' => $request->depreciation_method ?: 'Straight Line',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset created successfully',
            'data' => $asset
        ], 201);
    }

    /**
     * Display the specified asset.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $asset = Asset::where('user_id', $user->id)->where('id', $id)->first();

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Asset not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $asset]);
    }

    /**
     * Update the specified asset.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $asset = Asset::where('user_id', $user->id)->where('id', $id)->first();

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Asset not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'purchase_date' => 'sometimes|required|date',
            'purchase_cost' => 'sometimes|required|numeric|min:0',
            'useful_life' => 'nullable|integer|min:1',
            'depreciation_method' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $asset->update($request->only([
            'name', 'code', 'category', 'purchase_date',
            'purchase_cost', 'useful_life', 'depreciation_method'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Asset updated successfully',
            'data' => $asset
        ]);
    }

    /**
     * Remove the specified asset.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $asset = Asset::where('user_id', $user->id)->where('id', $id)->first();

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Asset not found'], 404);
        }

        $asset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asset deleted successfully'
        ]);
    }
}
