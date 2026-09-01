<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions for authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $query = Transaction::where('user_id', $user->id);

        if ($request->has('type') && in_array($request->type, ['income', 'expense'])) {
            $query->where('type', $request->type);
        }

        if ($request->has('category') && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        $transactions = $query->orderBy('date', 'desc')
                              ->orderBy('created_at', 'desc')
                              ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions,
            'count' => $transactions->count(),
            'meta' => [
                'total_income' => (float)$query->where('type', 'income')->sum('amount'),
                'total_expense' => (float)$query->where('type', 'expense')->sum('amount'),
            ]
        ]);
    }

    /**
     * Store a newly created transaction in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'type' => 'required|in:income,expense',
            'category' => 'nullable|string|max:100',
            'status' => 'nullable|in:Completed,Pending,Cancelled',
            'vendor' => 'nullable|string|max:255',
            'customer' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'entity' => 'nullable|string|max:50',
            'dr' => 'nullable|string|max:50',
            'cr' => 'nullable|string|max:50',
            'cur' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $customId = $request->input('id') ?: 'TX-' . strtoupper(Str::random(8));

        $transaction = Transaction::create([
            'id' => $customId,
            'user_id' => $user->id,
            'description' => $request->description,
            'amount' => $request->amount,
            'date' => $request->date,
            'type' => $request->type,
            'category' => $request->category ?: ($request->type === 'income' ? 'Sales' : 'Operational'),
            'status' => $request->status ?: 'Completed',
            'vendor' => $request->vendor,
            'customer' => $request->customer,
            'payment_method' => $request->payment_method,
            'notes' => $request->notes,
            'entity' => $request->entity ?: 'E1',
            'dr' => $request->dr,
            'cr' => $request->cr,
            'cur' => $request->cur ?: 'IDR',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => $transaction
        ], 201);
    }

    /**
     * Display the specified transaction.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $transaction = Transaction::where('user_id', $user->id)->where('id', $id)->first();

        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $transaction]);
    }

    /**
     * Update the specified transaction in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $transaction = Transaction::where('user_id', $user->id)->where('id', $id)->first();

        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
            'type' => 'sometimes|required|in:income,expense',
            'category' => 'nullable|string|max:100',
            'status' => 'nullable|in:Completed,Pending,Cancelled',
            'vendor' => 'nullable|string|max:255',
            'customer' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'entity' => 'nullable|string|max:50',
            'dr' => 'nullable|string|max:50',
            'cr' => 'nullable|string|max:50',
            'cur' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $transaction->update($request->only([
            'description', 'amount', 'date', 'type', 'category',
            'status', 'vendor', 'customer', 'payment_method',
            'notes', 'entity', 'dr', 'cr', 'cur'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => $transaction
        ]);
    }

    /**
     * Remove the specified transaction from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $transaction = Transaction::where('user_id', $user->id)->where('id', $id)->first();

        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
        }

        $transaction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully'
        ]);
    }

    /**
     * Get financial metrics summary for dashboard.
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $transactions = Transaction::where('user_id', $user->id)->get();

        $income = $transactions->where('type', 'income')->sum('amount');
        $expense = $transactions->where('type', 'expense')->sum('amount');
        $netProfit = $income - $expense;

        return response()->json([
            'success' => true,
            'data' => [
                'total_income' => (float)$income,
                'total_expense' => (float)$expense,
                'net_profit' => (float)$netProfit,
                'transaction_count' => $transactions->count(),
            ]
        ]);
    }
}
