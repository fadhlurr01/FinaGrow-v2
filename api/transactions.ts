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
        const rows = await sql`SELECT * FROM transactions WHERE user_id = ${user.id} ORDER BY date DESC, created_at DESC`;
        const mapped = rows.map((r: any) => ({
          ...r,
          amount: Number(r.amount)
        }));
        return res.status(200).json({ success: true, data: mapped });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    const body = await parseBody(req);

    if (req.method === 'POST') {
      try {
        const tx = body;
        const id = tx.id || 'TX_' + Date.now();
        const [newTx] = await sql`
          INSERT INTO transactions (id, user_id, description, amount, date, type, category, status, vendor, customer, payment_method, notes, entity, dr, cr, cur, created_at, updated_at)
          VALUES (
            ${id}, ${user.id}, ${tx.description || 'Transaksi'}, ${Number(tx.amount) || 0},
            ${tx.date || new Date().toISOString().slice(0, 10)}, ${tx.type || 'expense'},
            ${tx.category || 'General'}, ${tx.status || 'Completed'}, ${tx.vendor || null},
            ${tx.customer || null}, ${tx.payment_method || 'Cash'}, ${tx.notes || null},
            ${tx.entity || 'E1'}, ${tx.dr || null}, ${tx.cr || null}, ${tx.cur || 'IDR'},
            NOW(), NOW()
          ) RETURNING *
        `;
        return res.status(201).json({ success: true, data: newTx });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const tx = body;
        const id = req.query.id || tx.id;
        if (!id) return res.status(422).json({ success: false, message: 'Transaction ID required' });

        const [updatedTx] = await sql`
          UPDATE transactions SET 
            description = ${tx.description}, 
            amount = ${Number(tx.amount) || 0}, 
            date = ${tx.date}, 
            type = ${tx.type}, 
            category = ${tx.category}, 
            status = ${tx.status}, 
            vendor = ${tx.vendor || null}, 
            customer = ${tx.customer || null}, 
            payment_method = ${tx.payment_method || 'Cash'}, 
            notes = ${tx.notes || null}, 
            entity = ${tx.entity || 'E1'}, 
            dr = ${tx.dr || null}, 
            cr = ${tx.cr || null}, 
            cur = ${tx.cur || 'IDR'}, 
            updated_at = NOW()
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING *
        `;
        return res.status(200).json({ success: true, data: updatedTx });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query.id || body?.id;
        if (!id) return res.status(422).json({ success: false, message: 'Transaction ID required' });
        await sql`DELETE FROM transactions WHERE id = ${id} AND user_id = ${user.id}`;
        return res.status(200).json({ success: true, message: 'Transaction deleted' });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
