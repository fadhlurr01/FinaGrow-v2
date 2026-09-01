<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Asset;
use App\Models\Subscription;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate tables for completely clean seed
        Transaction::truncate();
        Asset::truncate();

        // 1. Demo Admin (Enterprise Pro)
        $demoAdmin = User::updateOrCreate(
            ['email' => 'demo_admin@fms.com'],
            [
                'name' => 'Demo Admin',
                'phone' => '08123456781',
                'password' => Hash::make('123456'),
                'role' => 'demo',
                'is_pro' => true,
                'is_banned' => false,
                'api_token' => 'DEMO_ADMIN_API_TOKEN_' . Str::random(30),
            ]
        );

        // 2. Demo User (UKM Free Suite)
        $demoUser = User::updateOrCreate(
            ['email' => 'demo_user@fms.com'],
            [
                'name' => 'Demo User',
                'phone' => '08123456782',
                'password' => Hash::make('123456'),
                'role' => 'demo',
                'is_pro' => false,
                'is_banned' => false,
                'api_token' => 'DEMO_USER_API_TOKEN_' . Str::random(30),
            ]
        );

        // 3. Demo Finagrow
        $demoMain = User::updateOrCreate(
            ['email' => 'demo@finagrow.com'],
            [
                'name' => 'Demo Admin',
                'phone' => '081234567890',
                'password' => Hash::make('123456'),
                'role' => 'demo',
                'is_pro' => true,
                'is_banned' => false,
                'api_token' => 'DEMO_MAIN_API_TOKEN_' . Str::random(30),
            ]
        );

        // Subscriptions
        Subscription::updateOrCreate(
            ['user_id' => $demoAdmin->id],
            [
                'plan' => 'Pro',
                'status' => 'active',
                'price' => 450000,
                'start_date' => now()->subMonths(3),
                'end_date' => now()->addMonths(9),
            ]
        );
        Subscription::updateOrCreate(
            ['user_id' => $demoMain->id],
            [
                'plan' => 'Pro',
                'status' => 'active',
                'price' => 450000,
                'start_date' => now()->subMonths(3),
                'end_date' => now()->addMonths(9),
            ]
        );
        Subscription::updateOrCreate(
            ['user_id' => $demoUser->id],
            [
                'plan' => 'Free',
                'status' => 'active',
                'price' => 0,
                'start_date' => now()->subMonths(1),
                'end_date' => null,
            ]
        );

        // Seed exact data for Demo Admin ($demoAdmin) & Demo Main ($demoMain)
        self::seedExactEnterpriseTransactions($demoAdmin, 'JE');
        self::seedExactEnterpriseTransactions($demoMain, 'JM');

        // Seed exact data for Demo User ($demoUser)
        self::seedExactRetailUserTransactions($demoUser, 'JU');
    }

    /**
     * Seed exactly matching Enterprise transactions & assets for Demo Admin.
     */
    public static function seedExactEnterpriseTransactions(User $user, string $prefix = 'JE'): void
    {
        $transactions = [
            [
                'id' => $prefix . '-0001',
                'user_id' => $user->id,
                'description' => 'Terima Termin 1 PT. Astra International',
                'amount' => 350000000,
                'date' => '2026-08-30',
                'type' => 'income',
                'category' => 'Sales',
                'status' => 'Completed',
                'vendor' => null,
                'customer' => 'PT. Astra International',
                'payment_method' => 'Bank Transfer (BCA)',
                'notes' => 'Penerimaan termin 1 kontrak lisensi ERP.',
                'entity' => 'E1',
                'dr' => 'AC_1002',
                'cr' => 'AC_1100',
                'cur' => 'IDR',
                'created_at' => '2026-08-30 10:00:00',
                'updated_at' => '2026-08-30 10:00:00',
            ],
            [
                'id' => $prefix . '-0002',
                'user_id' => $user->id,
                'description' => 'Bayar Cloud Server AWS',
                'amount' => 95000000,
                'date' => '2026-08-29',
                'type' => 'expense',
                'category' => 'Operational',
                'status' => 'Completed',
                'vendor' => 'AWS Cloud Services',
                'customer' => null,
                'payment_method' => 'Bank Transfer (BCA)',
                'notes' => 'Biaya server cluster AWS Singapore.',
                'entity' => 'E1',
                'dr' => 'AC_5000',
                'cr' => 'AC_1002',
                'cur' => 'IDR',
                'created_at' => '2026-08-29 11:30:00',
                'updated_at' => '2026-08-29 11:30:00',
            ],
            [
                'id' => $prefix . '-0003',
                'user_id' => $user->id,
                'description' => 'Distribusi Payroll Bulanan Direksi',
                'amount' => 185000000,
                'date' => '2026-08-28',
                'type' => 'expense',
                'category' => 'Payroll',
                'status' => 'Completed',
                'vendor' => 'Internal Payroll',
                'customer' => null,
                'payment_method' => 'Bank Transfer (Mandiri)',
                'notes' => 'Remunerasi dan gaji manajemen direksi.',
                'entity' => 'E1',
                'dr' => 'AC_5100',
                'cr' => 'AC_1003',
                'cur' => 'IDR',
                'created_at' => '2026-08-28 14:00:00',
                'updated_at' => '2026-08-28 14:00:00',
            ],
            [
                'id' => $prefix . '-0004',
                'user_id' => $user->id,
                'description' => 'SaaS Agreement - Singapore Corp',
                'amount' => 48000,
                'date' => '2026-08-26',
                'type' => 'income',
                'category' => 'Sales',
                'status' => 'Completed',
                'vendor' => null,
                'customer' => 'Singapore Corp',
                'payment_method' => 'Corporate Virtual Account',
                'notes' => 'Subscription seat retainer bulanan.',
                'entity' => 'E1',
                'dr' => 'AC_1002',
                'cr' => 'AC_4000',
                'cur' => 'IDR',
                'created_at' => '2026-08-26 09:15:00',
                'updated_at' => '2026-08-26 09:15:00',
            ],
            [
                'id' => $prefix . '-0005',
                'user_id' => $user->id,
                'description' => 'Bayar Kampanye Digital agency',
                'amount' => 50000000,
                'date' => '2026-08-24',
                'type' => 'expense',
                'category' => 'Marketing',
                'status' => 'Completed',
                'vendor' => 'Digital Agency',
                'customer' => null,
                'payment_method' => 'Bank Transfer (BCA)',
                'notes' => 'Pembayaran jasa agency digital marketing.',
                'entity' => 'E1',
                'dr' => 'AC_5300',
                'cr' => 'AC_1002',
                'cur' => 'IDR',
                'created_at' => '2026-08-24 16:20:00',
                'updated_at' => '2026-08-24 16:20:00',
            ],
        ];

        foreach ($transactions as $tx) {
            Transaction::create($tx);
        }

        Asset::create([
            'id' => 'AST-' . $prefix . '-01',
            'user_id' => $user->id,
            'code' => 'AST-EQ-100',
            'name' => 'Server HP ProLiant Gen10',
            'category' => 'EQUIPMENT',
            'purchase_date' => '2026-05-02',
            'purchase_cost' => 180000000,
            'useful_life' => 5,
            'depreciation_method' => 'STRAIGHT LINE',
        ]);
    }

    /**
     * Seed exactly matching Retail transactions for Demo User (Screenshot_1967).
     */
    public static function seedExactRetailUserTransactions(User $user, string $prefix = 'JU'): void
    {
        $transactions = [
            [
                'id' => $prefix . '-0001',
                'user_id' => $user->id,
                'description' => 'Penjualan Retail Kasir Sesi Pagi',
                'amount' => 3500000,
                'date' => '2026-09-01',
                'type' => 'income',
                'category' => 'Sales',
                'status' => 'Completed',
                'vendor' => null,
                'customer' => 'Pelanggan Retail',
                'payment_method' => 'Cash',
                'notes' => 'Penerimaan tunai kasir pagi.',
                'entity' => 'E1',
                'dr' => 'AC_1001',
                'cr' => 'AC_4000',
                'cur' => 'IDR',
                'created_at' => '2026-09-01 09:00:00',
                'updated_at' => '2026-09-01 09:00:00',
            ],
            [
                'id' => $prefix . '-0002',
                'user_id' => $user->id,
                'description' => 'Belanja Stok Sembako Pasar Anyar',
                'amount' => 1800000,
                'date' => '2026-08-31',
                'type' => 'expense',
                'category' => 'Operational',
                'status' => 'Completed',
                'vendor' => 'Pasar Anyar Grosir',
                'customer' => null,
                'payment_method' => 'Cash',
                'notes' => 'Pembelian stok sembako eceran.',
                'entity' => 'E1',
                'dr' => 'AC_1200',
                'cr' => 'AC_1001',
                'cur' => 'IDR',
                'created_at' => '2026-08-31 11:00:00',
                'updated_at' => '2026-08-31 11:00:00',
            ],
            [
                'id' => $prefix . '-0003',
                'user_id' => $user->id,
                'description' => 'Gaji Bulanan 2 Kasir Toko',
                'amount' => 5000000,
                'date' => '2026-08-30',
                'type' => 'expense',
                'category' => 'Payroll',
                'status' => 'Completed',
                'vendor' => 'Kasir Toko',
                'customer' => null,
                'payment_method' => 'Bank Transfer (Jatim)',
                'notes' => 'Gaji bulanan penjaga kasir.',
                'entity' => 'E1',
                'dr' => 'AC_5100',
                'cr' => 'AC_1002',
                'cur' => 'IDR',
                'created_at' => '2026-08-30 15:00:00',
                'updated_at' => '2026-08-30 15:00:00',
            ],
        ];

        foreach ($transactions as $tx) {
            Transaction::create($tx);
        }

        // 3 Fixed Assets matching Screenshot (MacBook, Ruko, Avanza)
        Asset::create([
            'id' => 'AST-' . $prefix . '-01',
            'user_id' => $user->id,
            'code' => 'AST-EQP-001',
            'name' => 'MacBook Pro M3 Max 16" (Desain)',
            'category' => 'EQUIPMENT',
            'purchase_date' => '2024-01-15',
            'purchase_cost' => 45000000,
            'useful_life' => 4,
            'depreciation_method' => 'STRAIGHT LINE',
        ]);
        Asset::create([
            'id' => 'AST-' . $prefix . '-02',
            'user_id' => $user->id,
            'code' => 'AST-BLD-001',
            'name' => 'Ruko Sentra Kemang (Kantor)',
            'category' => 'BUILDING',
            'purchase_date' => '2021-03-01',
            'purchase_cost' => 1500000000,
            'useful_life' => 20,
            'depreciation_method' => 'STRAIGHT LINE',
        ]);
        Asset::create([
            'id' => 'AST-' . $prefix . '-03',
            'user_id' => $user->id,
            'code' => 'AST-VEH-001',
            'name' => 'Toyota Avanza Operational',
            'category' => 'VEHICLE',
            'purchase_date' => '2022-06-10',
            'purchase_cost' => 260000000,
            'useful_life' => 8,
            'depreciation_method' => 'STRAIGHT LINE',
        ]);
    }
}
