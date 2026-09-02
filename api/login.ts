import { getPool, parseBody } from './_db';
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

    const body = parseBody(req);
    const { email, password } = body;
    if (!email || !password) {
      return res.status(422).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const normEmail = String(email).trim().toLowerCase();
    const pool = getPool();

    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normEmail]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi tidak sesuai.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan oleh administrator.' });
    }

    // Check password: match plaintext or bcrypt hash
    let isPasswordValid = false;
    if (user.password === String(password)) {
      isPasswordValid = true;
    } else if (user.password && (user.password.startsWith('$2y$') || user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      const formattedHash = user.password.replace(/^\$2y\$/, '$2a$');
      isPasswordValid = await bcrypt.compare(String(password), formattedHash).catch(() => false);
      if (!isPasswordValid) {
        isPasswordValid = await bcrypt.compare(String(password), user.password).catch(() => false);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi tidak sesuai.' });
    }

    // Token generation
    let token = user.api_token;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await pool.query('UPDATE users SET api_token = $1 WHERE id = $2', [token, user.id]);
    }

    // Get active subscription
    const subRes = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [user.id]);
    const sub = subRes.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_pro: Boolean(user.is_pro),
        subscription: user.is_pro ? 'Pro' : (sub ? sub.plan : 'Free')
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
