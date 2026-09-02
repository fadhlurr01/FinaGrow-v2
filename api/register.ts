import { pool } from './_db';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(422).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
  }

  const normEmail = String(email).trim().toLowerCase();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [normEmail]);
    if (existing.rows.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Email sudah terdaftar.',
        errors: { email: ['Email ini sudah digunakan oleh akun lain.'] }
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const insertRes = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, is_pro, is_banned, api_token, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'user', false, false, $5, NOW(), NOW()) RETURNING *`,
      [String(name).trim(), normEmail, phone ? String(phone).trim() : null, String(password), token]
    );
    const newUser = insertRes.rows[0];

    // Create free subscription
    await pool.query(
      `INSERT INTO subscriptions (user_id, plan, status, price, start_date, end_date, created_at, updated_at)
       VALUES ($1, 'Free', 'active', 0, NOW(), NOW() + INTERVAL '10 years', NOW(), NOW())`,
      [newUser.id]
    );

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
