import { getUserFromToken, sql, parseBody } from './_db.js';

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

    const body = parseBody(req);
    const { plan } = body;
    const newPlan = plan === 'Enterprise' ? 'Enterprise' : 'Pro';

    await sql`UPDATE users SET is_pro = true WHERE id = ${user.id}`;
    await sql`
      INSERT INTO subscriptions (user_id, plan, status, price, start_date, end_date, created_at, updated_at)
      VALUES (${user.id}, ${newPlan}, 'active', ${newPlan === 'Enterprise' ? 2490000 : 499000}, NOW(), NOW() + INTERVAL '1 year', NOW(), NOW())
    `;

    return res.status(200).json({
      success: true,
      message: `Selamat! Anda berhasil upgrade ke paket ${newPlan}.`,
      plan: newPlan,
      is_pro: true
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
