import { getUserFromToken, getPool, parseBody } from './_db';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pool = getPool();

    if (req.method === 'GET') {
      try {
        const coaRes = await pool.query('SELECT * FROM coa_accounts WHERE user_id = $1 ORDER BY code ASC', [user.id]);
        const rows = coaRes.rows.map((r: any) => ({
          ...r,
          openingBalance: Number(r.opening_balance)
        }));
        return res.status(200).json({ success: true, data: rows });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    const body = parseBody(req);

    if (req.method === 'POST') {
      try {
        const c = body;
        const id = c.id || 'AC_' + (c.code || Date.now());
        const insertRes = await pool.query(
          `INSERT INTO coa_accounts (id, user_id, code, name, type, description, parent_account_id, opening_balance, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
          [
            id, user.id, String(c.code).trim(), String(c.name).trim(),
            c.type || 'Asset', c.description || null, c.parent_account_id || null,
            Number(c.opening_balance || c.openingBalance) || 0
          ]
        );
        return res.status(201).json({ success: true, data: insertRes.rows[0] });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const c = body;
        const id = req.query.id || c.id;
        if (!id) return res.status(422).json({ success: false, message: 'COA ID required' });

        const updateRes = await pool.query(
          `UPDATE coa_accounts SET code = $1, name = $2, type = $3, description = $4, parent_account_id = $5, opening_balance = $6, updated_at = NOW()
           WHERE id = $7 AND user_id = $8 RETURNING *`,
          [
            String(c.code).trim(), String(c.name).trim(), c.type || 'Asset',
            c.description || null, c.parent_account_id || null,
            Number(c.opening_balance || c.openingBalance) || 0, id, user.id
          ]
        );
        return res.status(200).json({ success: true, data: updateRes.rows[0] });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query.id || body?.id;
        if (!id) return res.status(422).json({ success: false, message: 'COA ID required' });
        await pool.query('DELETE FROM coa_accounts WHERE id = $1 AND user_id = $2', [id, user.id]);
        return res.status(200).json({ success: true, message: 'COA Account deleted' });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
