import { Pool } from 'pg';

const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  `postgres://${process.env.DB_USERNAME || 'avnadmin'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'finagrow-db-finagrow.c.aivencloud.com'}:${process.env.DB_PORT || '10091'}/${process.env.DB_DATABASE || 'defaultdb'}?sslmode=require`;

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function getUserFromToken(req: any) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const res = await pool.query('SELECT * FROM users WHERE api_token = $1 LIMIT 1', [token]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error fetching user from token:', err);
    return null;
  }
}
