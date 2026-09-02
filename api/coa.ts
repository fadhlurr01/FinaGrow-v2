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
        const rows = await sql`SELECT * FROM coa_accounts WHERE user_id = ${user.id} ORDER BY code ASC`;
        const mapped = rows.map((r: any) => ({
          ...r,
          openingBalance: Number(r.opening_balance || 0)
        }));
        return res.status(200).json({ success: true, data: mapped });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    const body = await parseBody(req);

    if (req.method === 'POST') {
      try {
        const c = body;
        const id = c.id || 'AC_' + (c.code || Date.now()) + '_U' + user.id;
        const [newCoa] = await sql`
          INSERT INTO coa_accounts (id, user_id, code, name, type, description, parent_account_id, opening_balance, created_at, updated_at)
          VALUES (
            ${id}, ${user.id}, ${String(c.code).trim()}, ${String(c.name).trim()},
            ${c.type || 'Asset'}, ${c.description || null}, ${c.parent_account_id || null},
            ${Number(c.opening_balance || c.openingBalance) || 0},
            NOW(), NOW()
          ) RETURNING *
        `;
        return res.status(201).json({
          success: true,
          data: {
            ...newCoa,
            openingBalance: Number(newCoa.opening_balance || 0)
          }
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const c = body;
        const id = req.query.id || c.id;
        if (!id) return res.status(422).json({ success: false, message: 'COA ID required' });

        const [updatedCoa] = await sql`
          UPDATE coa_accounts SET 
            code = ${String(c.code).trim()}, 
            name = ${String(c.name).trim()}, 
            type = ${c.type || 'Asset'}, 
            description = ${c.description || null}, 
            parent_account_id = ${c.parent_account_id || null}, 
            opening_balance = ${Number(c.opening_balance || c.openingBalance) || 0}, 
            updated_at = NOW()
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING *
        `;
        return res.status(200).json({
          success: true,
          data: {
            ...updatedCoa,
            openingBalance: Number(updatedCoa.opening_balance || 0)
          }
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query.id || body?.id;
        if (!id) return res.status(422).json({ success: false, message: 'COA ID required' });
        await sql`DELETE FROM coa_accounts WHERE id = ${id} AND user_id = ${user.id}`;
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
