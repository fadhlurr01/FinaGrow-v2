import { pool } from './_db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const adminRes = await pool.query("SELECT * FROM users WHERE email = 'demo_admin@fms.com' LIMIT 1");
    let admin = adminRes.rows[0];

    if (!admin) {
      const userRes = await pool.query("SELECT * FROM users WHERE role = 'admin' OR role = 'demo' LIMIT 1");
      admin = userRes.rows[0];
    }

    if (!admin) {
      return res.status(200).json({
        success: true,
        token: 'DEMO_FALLBACK_TOKEN_12345678',
        user: { id: 1, name: 'Demo Administrator', email: 'demo_admin@fms.com', role: 'admin', is_pro: true, subscription: 'Pro' }
      });
    }

    return res.status(200).json({
      success: true,
      token: admin.api_token || 'DEMO_ADMIN_TOKEN_SECURE',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        is_pro: true,
        subscription: 'Pro'
      }
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      token: 'DEMO_FALLBACK_TOKEN_12345678',
      user: { id: 1, name: 'Demo Administrator', email: 'demo_admin@fms.com', role: 'admin', is_pro: true, subscription: 'Pro' }
    });
  }
}
