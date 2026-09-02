import { sql, parseBody } from './_db.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const body = await parseBody(req);
    const { name, email, password, phone } = body;
    if (!name || !email || !password) {
      return res.status(422).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    const normEmail = String(email).trim().toLowerCase();

    const existing = await sql`SELECT id FROM users WHERE LOWER(email) = ${normEmail} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Email sudah terdaftar.',
        errors: { email: ['Email ini sudah digunakan oleh akun lain.'] }
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(String(password), 10);

    const [newUser] = await sql`
      INSERT INTO users (name, email, phone, password, role, is_pro, is_banned, api_token, created_at, updated_at)
      VALUES (${String(name).trim()}, ${normEmail}, ${phone ? String(phone).trim() : null}, ${hashedPassword}, 'user', false, false, ${token}, NOW(), NOW())
      RETURNING *
    `;

    // Create free subscription
    await sql`
      INSERT INTO subscriptions (user_id, plan, status, price, start_date, end_date, created_at, updated_at)
      VALUES (${newUser.id}, 'Free', 'active', 0, NOW(), NOW() + INTERVAL '10 years', NOW(), NOW())
    `;

    // Initialize starter Chart of Accounts for new user
    const starterCOA = [
      { code: '1001', name: 'Kas Utama', type: 'Asset', desc: 'Kas tunai operasional', bal: 0 },
      { code: '1002', name: 'Rekening Bank Operasional', type: 'Asset', desc: 'Rekening bank operasional utama', bal: 0 },
      { code: '1100', name: 'Piutang Usaha', type: 'Asset', desc: 'Tagihan piutang pelanggan', bal: 0 },
      { code: '1200', name: 'Persediaan Barang Dagang', type: 'Asset', desc: 'Nilai stok inventaris', bal: 0 },
      { code: '2000', name: 'Utang Usaha', type: 'Liability', desc: 'Utang ke pemasok/supplier', bal: 0 },
      { code: '3000', name: 'Modal Pemilik', type: 'Equity', desc: 'Modal disetor pemilik usaha', bal: 0 },
      { code: '4000', name: 'Pendapatan Penjualan', type: 'Revenue', desc: 'Pendapatan usaha', bal: 0 },
      { code: '5100', name: 'Beban Gaji & Upah', type: 'Expense', desc: 'Beban gaji karyawan', bal: 0 },
      { code: '5200', name: 'Beban Utilitas & Operasional', type: 'Expense', desc: 'Listrik, air, dan operasional', bal: 0 }
    ];

    for (const acc of starterCOA) {
      const coaId = `AC_${acc.code}_U${newUser.id}`;
      await sql`
        INSERT INTO coa_accounts (id, user_id, code, name, type, description, parent_account_id, opening_balance, created_at, updated_at)
        VALUES (${coaId}, ${newUser.id}, ${acc.code}, ${acc.name}, ${acc.type}, ${acc.desc}, null, ${acc.bal}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `.catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        is_pro: false,
        subscription: 'Free'
      }
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
