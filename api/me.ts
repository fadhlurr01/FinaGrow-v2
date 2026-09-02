import { getUserFromToken, getPool } from './_db';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pool = getPool();
    const subRes = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [user.id]);
    const sub = subRes.rows[0];

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
