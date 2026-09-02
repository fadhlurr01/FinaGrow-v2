import pg from 'pg';

export default async function handler(req: any, res: any) {
  try {
    const Pool = (pg as any).Pool || (pg as any).default?.Pool || pg;
    const pool = new Pool({
      connectionString: (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/[?&]sslmode=[^&]+/g, ''),
      ssl: { rejectUnauthorized: false }
    });
    const queryRes = await pool.query('SELECT COUNT(*) as count FROM users');
    return res.status(200).json({ success: true, count: queryRes.rows[0].count, envExists: Boolean(process.env.DATABASE_URL) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
}
