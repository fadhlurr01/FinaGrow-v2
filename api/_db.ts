import pg from 'pg';

const Pool = (pg as any).Pool || (pg as any).default?.Pool || pg;

const rawConnStr = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  `postgres://${process.env.DB_USERNAME || 'avnadmin'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'finagrow-db-finagrow.c.aivencloud.com'}:${process.env.DB_PORT || '10091'}/${process.env.DB_DATABASE || 'defaultdb'}`;

// Strip sslmode parameter if present to allow custom ssl object without conflict
const cleanConnStr = rawConnStr.replace(/[?&]sslmode=[^&]+/g, '');

export const pool = new Pool({
  connectionString: cleanConnStr,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export function parseBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body);
  } catch (_) {
    return {};
  }
}

export async function getUserFromToken(req: any) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.headers['token'];
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
