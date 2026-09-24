<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AssetController extends Controller
{
    private function formatAsset(Asset $a): array
    {
        $cost = (float)$a->purchase_cost;
        $usefulLife = (int)($a->useful_life ?: 5);
        $purchaseDate = $a->purchase_date ? substr((string)$a->purchase_date, 0, 10) : date('Y-m-d');
        
        $yearsElapsed = max(0, (time() - strtotime($purchaseDate)) / (365.25 * 86400));
        $accumDep = $usefulLife > 0 ? min($cost, round(($cost / $usefulLife) * $yearsElapsed, 2)) : 0;
        $bookVal = max(0, $cost - $accumDep);

        return [
            'id' => (string)$a->id,
            'code' => $a->code ?: ('AST-' . substr((string)$a->id, -4)),
            'name' => $a->name,
            'category' => $a->category ?: 'Equipment',
            'purchase_date' => $purchaseDate,
            'purchaseDate' => $purchaseDate,
            'purchase_cost' => $cost,
            'purchaseCost' => $cost,
            'useful_life' => $usefulLife,
            'usefulLife' => $usefulLife,
            'depreciation_method' => $a->depreciation_method ?: 'Straight Line',
            'depreciationMethod' => $a->depreciation_method ?: 'Straight Line',
            'accumulatedDepreciation' => $accumDep,
            'bookValue' => $bookVal,
        ];
    }

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

        $formatted = $assets->map(fn($a) => $this->formatAsset($a));

        return response()->json([
            'success' => true,
            'data' => $formatted,
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

        $purchaseDate = $request->input('purchase_date') ?: $request->input('purchaseDate') ?: date('Y-m-d');
        $purchaseCost = $request->input('purchase_cost') !== null ? $request->input('purchase_cost') : $request->input('purchaseCost', 0);
        $usefulLife = $request->input('useful_life') !== null ? $request->input('useful_life') : $request->input('usefulLife', 5);
        $depMethod = $request->input('depreciation_method') ?: $request->input('depreciationMethod', 'Straight Line');

        $validator = Validator::make([
            'name' => $request->name,
            'code' => $request->code,
            'category' => $request->category,
            'purchase_date' => $purchaseDate,
            'purchase_cost' => $purchaseCost,
            'useful_life' => $usefulLife,
            'depreciation_method' => $depMethod,
        ], [
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
            'code' => $request->code ?: ('AST-' . rand(100, 999)),
            'name' => $request->name,
            'category' => $request->category ?: 'Equipment',
            'purchase_date' => $purchaseDate,
            'purchase_cost' => $purchaseCost,
            'useful_life' => $usefulLife,
            'depreciation_method' => $depMethod,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset created successfully',
            'data' => $this->formatAsset($asset)
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

        return response()->json(['success' => true, 'data' => $this->formatAsset($asset)]);
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

        $purchaseDate = $request->input('purchase_date') ?: $request->input('purchaseDate');
        $purchaseCost = $request->input('purchase_cost') !== null ? $request->input('purchase_cost') : $request->input('purchaseCost');
        $usefulLife = $request->input('useful_life') !== null ? $request->input('useful_life') : $request->input('usefulLife');
        $depMethod = $request->input('depreciation_method') ?: $request->input('depreciationMethod');

        $updateData = [];
        if ($request->has('name')) $updateData['name'] = $request->name;
        if ($request->has('code')) $updateData['code'] = $request->code;
        if ($request->has('category')) $updateData['category'] = $request->category;
        if ($purchaseDate !== null) $updateData['purchase_date'] = $purchaseDate;
        if ($purchaseCost !== null) $updateData['purchase_cost'] = $purchaseCost;
        if ($usefulLife !== null) $updateData['useful_life'] = $usefulLife;
        if ($depMethod !== null) $updateData['depreciation_method'] = $depMethod;

        $asset->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Asset updated successfully',
            'data' => $this->formatAsset($asset)
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
