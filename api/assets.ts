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
        const assetRes = await pool.query('SELECT * FROM assets WHERE user_id = $1 ORDER BY purchase_date DESC', [user.id]);
        const rows = assetRes.rows.map((r: any) => ({
          ...r,
          purchaseCost: Number(r.purchase_cost),
          usefulLife: Number(r.useful_life),
          depreciationMethod: r.depreciation_method
        }));
        return res.status(200).json({ success: true, data: rows });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    const body = parseBody(req);

    if (req.method === 'POST') {
      try {
        const a = body;
        const id = a.id || 'AST_' + Date.now();
        const insertRes = await pool.query(
          `INSERT INTO assets (id, user_id, code, name, category, purchase_date, purchase_cost, useful_life, depreciation_method, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
          [
            id, user.id, a.code || 'AST-001', a.name || 'Aset',
            a.category || 'Equipment', a.purchase_date || a.purchaseDate || new Date().toISOString().slice(0, 10),
            Number(a.purchase_cost || a.purchaseCost) || 0, Number(a.useful_life || a.usefulLife) || 5,
            a.depreciation_method || a.depreciationMethod || 'Straight Line'
          ]
        );
        return res.status(201).json({ success: true, data: insertRes.rows[0] });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const a = body;
        const id = req.query.id || a.id;
        if (!id) return res.status(422).json({ success: false, message: 'Asset ID required' });

        const updateRes = await pool.query(
          `UPDATE assets SET code = $1, name = $2, category = $3, purchase_date = $4, purchase_cost = $5, useful_life = $6, depreciation_method = $7, updated_at = NOW()
           WHERE id = $8 AND user_id = $9 RETURNING *`,
          [
            a.code, a.name, a.category, a.purchase_date || a.purchaseDate,
            Number(a.purchase_cost || a.purchaseCost) || 0, Number(a.useful_life || a.usefulLife) || 5,
            a.depreciation_method || a.depreciationMethod || 'Straight Line', id, user.id
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
        if (!id) return res.status(422).json({ success: false, message: 'Asset ID required' });
        await pool.query('DELETE FROM assets WHERE id = $1 AND user_id = $2', [id, user.id]);
        return res.status(200).json({ success: true, message: 'Asset deleted' });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
