import { getUserFromToken, pool } from './_db';

export default async function handler(req: any, res: any) {
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
      const txRes = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC', [user.id]);
      const rows = txRes.rows.map(r => ({
        ...r,
        amount: Number(r.amount)
      }));
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const tx = req.body || {};
      const id = tx.id || 'TX_' + Date.now();
      const insertRes = await pool.query(
        `INSERT INTO transactions (id, user_id, description, amount, date, type, category, status, vendor, customer, payment_method, notes, entity, dr, cr, cur, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()) RETURNING *`,
        [
          id, user.id, tx.description || 'Transaksi', Number(tx.amount) || 0,
          tx.date || new Date().toISOString().slice(0, 10), tx.type || 'expense',
          tx.category || 'General', tx.status || 'Completed', tx.vendor || null,
          tx.customer || null, tx.payment_method || 'Cash', tx.notes || null,
          tx.entity || 'E1', tx.dr || null, tx.cr || null, tx.cur || 'IDR'
        ]
      );
      return res.status(201).json({ success: true, data: insertRes.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const tx = req.body || {};
      const id = req.query.id || tx.id;
      if (!id) return res.status(422).json({ success: false, message: 'Transaction ID required' });

      const updateRes = await pool.query(
        `UPDATE transactions SET description = $1, amount = $2, date = $3, type = $4, category = $5, status = $6, vendor = $7, customer = $8, payment_method = $9, notes = $10, entity = $11, dr = $12, cr = $13, cur = $14, updated_at = NOW()
         WHERE id = $15 AND user_id = $16 RETURNING *`,
        [
          tx.description, Number(tx.amount) || 0, tx.date, tx.type, tx.category,
          tx.status, tx.vendor || null, tx.customer || null, tx.payment_method || 'Cash',
          tx.notes || null, tx.entity || 'E1', tx.dr || null, tx.cr || null,
          tx.cur || 'IDR', id, user.id
        ]
      );
      return res.status(200).json({ success: true, data: updateRes.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = req.query.id || req.body?.id;
      if (!id) return res.status(422).json({ success: false, message: 'Transaction ID required' });
      await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, user.id]);
      return res.status(200).json({ success: true, message: 'Transaction deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
