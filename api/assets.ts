import { getUserFromToken, sql, parseBody } from './_db.js';

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

    if (req.method === 'GET') {
      try {
        const rows = await sql`SELECT * FROM assets WHERE user_id = ${user.id} ORDER BY purchase_date DESC`;
        const mapped = rows.map((r: any) => ({
          ...r,
          purchaseCost: Number(r.purchase_cost),
          usefulLife: Number(r.useful_life),
          depreciationMethod: r.depreciation_method
        }));
        return res.status(200).json({ success: true, data: mapped });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    const body = parseBody(req);

    if (req.method === 'POST') {
      try {
        const a = body;
        const id = a.id || 'AST_' + Date.now();
        const [newAsset] = await sql`
          INSERT INTO assets (id, user_id, code, name, category, purchase_date, purchase_cost, useful_life, depreciation_method, created_at, updated_at)
          VALUES (
            ${id}, ${user.id}, ${a.code || 'AST-001'}, ${a.name || 'Aset'},
            ${a.category || 'Equipment'}, ${a.purchase_date || a.purchaseDate || new Date().toISOString().slice(0, 10)},
            ${Number(a.purchase_cost || a.purchaseCost) || 0}, ${Number(a.useful_life || a.usefulLife) || 5},
            ${a.depreciation_method || a.depreciationMethod || 'Straight Line'},
            NOW(), NOW()
          ) RETURNING *
        `;
        return res.status(201).json({ success: true, data: newAsset });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const a = body;
        const id = req.query.id || a.id;
        if (!id) return res.status(422).json({ success: false, message: 'Asset ID required' });

        const [updatedAsset] = await sql`
          UPDATE assets SET 
            code = ${a.code}, 
            name = ${a.name}, 
            category = ${a.category}, 
            purchase_date = ${a.purchase_date || a.purchaseDate}, 
            purchase_cost = ${Number(a.purchase_cost || a.purchaseCost) || 0}, 
            useful_life = ${Number(a.useful_life || a.usefulLife) || 5}, 
            depreciation_method = ${a.depreciation_method || a.depreciationMethod || 'Straight Line'}, 
            updated_at = NOW()
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING *
        `;
        return res.status(200).json({ success: true, data: updatedAsset });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query.id || body?.id;
        if (!id) return res.status(422).json({ success: false, message: 'Asset ID required' });
        await sql`DELETE FROM assets WHERE id = ${id} AND user_id = ${user.id}`;
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
