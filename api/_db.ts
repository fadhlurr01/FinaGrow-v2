import postgres from 'postgres';

const rawConnStr = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  `postgres://${process.env.DB_USERNAME || 'avnadmin'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'finagrow-db-finagrow.c.aivencloud.com'}:${process.env.DB_PORT || '10091'}/${process.env.DB_DATABASE || 'defaultdb'}?sslmode=require`;

export const sql = postgres(rawConnStr, {
  ssl: 'require',
  max: 1,              // 1 connection per serverless function instance
  idle_timeout: 1,     // Release slot immediately when idle
  max_lifetime: 10,    // Recycle connections
  connect_timeout: 10,
});

export async function parseBody(req: any): Promise<any> {
  try {
    const raw = req.body;
    if (raw) {
      if (typeof raw === 'object') return raw;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (_) {
          return {};
        }
      }
    }
  } catch (_) {
    return {};
  }
  return {};
}

export async function getUserFromToken(req: any) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.headers['token'];
  if (!authHeader || typeof authHeader !== 'string') return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const [user] = await sql`SELECT * FROM users WHERE api_token = ${token} LIMIT 1`;
    return user || null;
  } catch (err) {
    console.error('Error fetching user from token:', err);
    return null;
  }
}
