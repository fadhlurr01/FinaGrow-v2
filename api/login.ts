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

    const body = parseBody(req);
    const { email, password } = body;
    if (!email || !password) {
      return res.status(422).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const normEmail = String(email).trim().toLowerCase();

    const [user] = await sql`SELECT * FROM users WHERE LOWER(email) = ${normEmail} LIMIT 1`;

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
      await sql`UPDATE users SET api_token = ${token} WHERE id = ${user.id}`;
    }

    // Get active subscription
    const [sub] = await sql`SELECT * FROM subscriptions WHERE user_id = ${user.id} ORDER BY id DESC LIMIT 1`;

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
