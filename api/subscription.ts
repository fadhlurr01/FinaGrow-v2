import { getUserFromToken, getPool, parseBody } from './_db';

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
    const body = parseBody(req);
    const { plan } = body;
    const newPlan = plan === 'Enterprise' ? 'Enterprise' : 'Pro';

    await pool.query('UPDATE users SET is_pro = true WHERE id = $1', [user.id]);
    await pool.query(
      `INSERT INTO subscriptions (user_id, plan, status, price, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, 'active', $3, NOW(), NOW() + INTERVAL '1 year', NOW(), NOW())`,
      [user.id, newPlan, newPlan === 'Enterprise' ? 2490000 : 499000]
    );

    return res.status(200).json({
      success: true,
      message: `Selamat! Anda berhasil upgrade ke paket ${newPlan}.`,
      plan: newPlan,
      is_pro: true
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
