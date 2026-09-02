import { sql, parseBody, getUserFromToken } from './_db.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      try {
        const rows = await sql`
          SELECT u.id, u.name, u.email, u.phone, u.role, u.is_pro, u.is_banned, u.created_at,
                 COALESCE(s.plan, CASE WHEN u.is_pro THEN 'Pro' ELSE 'Free' END) as subscription
          FROM users u
          LEFT JOIN LATERAL (
            SELECT plan FROM subscriptions WHERE user_id = u.id ORDER BY id DESC LIMIT 1
          ) s ON true
          ORDER BY u.id ASC
        `;

        const mapped = rows.map((u: any) => {
          const emailLower = (u.email || '').toLowerCase();
          const isAdmin = u.role === 'admin' || u.role === 'demo' || emailLower.includes('admin');
          return {
            id: String(u.id),
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: isAdmin ? 'Admin' : (u.role === 'owner' ? 'Owner' : (u.role === 'accountant' ? 'Accountant' : (u.role === 'manager' ? 'Manager' : 'User'))),
            subscription: u.is_pro || isAdmin ? 'Pro Plan' : (u.subscription === 'Enterprise' ? 'Enterprise Plan' : 'Free Plan'),
            status: u.is_banned ? 'Suspended' : 'Active',
            createdAt: u.created_at
          };
        });

        return res.status(200).json({ success: true, data: mapped });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    const body = await parseBody(req);

    if (req.method === 'POST') {
      try {
        const { name, email, role = 'user', phone, password = 'password123' } = body;
        if (!name || !email) {
          return res.status(422).json({ success: false, message: 'Name and email are required' });
        }
        const normEmail = String(email).trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(String(password), 10);
        const token = crypto.randomBytes(32).toString('hex');
        const roleLower = String(role).toLowerCase();

        const [newUser] = await sql`
          INSERT INTO users (name, email, phone, password, role, is_pro, is_banned, api_token, created_at, updated_at)
          VALUES (${String(name).trim()}, ${normEmail}, ${phone ? String(phone).trim() : null}, ${hashedPassword}, ${roleLower}, ${roleLower === 'admin' || roleLower === 'owner'}, false, ${token}, NOW(), NOW())
          RETURNING *
        `;

        return res.status(201).json({
          success: true,
          data: {
            id: String(newUser.id),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            subscription: newUser.is_pro ? 'Pro Plan' : 'Free Plan',
            status: 'Active'
          }
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const id = req.query.id || body.id;
        if (!id) return res.status(422).json({ success: false, message: 'User ID required' });
        const { name, role, status } = body;
        const isBanned = status === 'Suspended' || status === 'Banned';

        const [updatedUser] = await sql`
          UPDATE users SET 
            name = COALESCE(${name ? String(name).trim() : null}, name),
            role = COALESCE(${role ? String(role).toLowerCase() : null}, role),
            is_banned = ${isBanned},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;

        return res.status(200).json({ success: true, data: updatedUser });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query.id || body.id;
        if (!id) return res.status(422).json({ success: false, message: 'User ID required' });
        await sql`DELETE FROM users WHERE id = ${id}`;
        return res.status(200).json({ success: true, message: 'User deleted from cloud database' });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
