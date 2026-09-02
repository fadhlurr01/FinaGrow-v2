import { sql } from './_db';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const [admin] = await sql`SELECT * FROM users WHERE email = 'demo_admin@fms.com' LIMIT 1`;

    if (!admin) {
      return res.status(200).json({
        success: true,
        token: 'DEMO_ADMIN_API_TOKEN_EsF5h6B1nHaCVvCcbKzKDYrqfb4u4c',
        user: { id: 1, name: 'Demo Admin', email: 'demo_admin@fms.com', role: 'admin', is_pro: true, subscription: 'Pro' }
      });
    }

    return res.status(200).json({
      success: true,
      token: admin.api_token || 'DEMO_ADMIN_API_TOKEN_EsF5h6B1nHaCVvCcbKzKDYrqfb4u4c',
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
      token: 'DEMO_ADMIN_API_TOKEN_EsF5h6B1nHaCVvCcbKzKDYrqfb4u4c',
      user: { id: 1, name: 'Demo Admin', email: 'demo_admin@fms.com', role: 'admin', is_pro: true, subscription: 'Pro' }
    });
  }
}
