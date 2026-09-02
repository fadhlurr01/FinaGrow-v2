import postgres from 'postgres';

const rawConnStr = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  `postgres://${process.env.DB_USERNAME || 'avnadmin'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'finagrow-db-finagrow.c.aivencloud.com'}:${process.env.DB_PORT || '10091'}/${process.env.DB_DATABASE || 'defaultdb'}?sslmode=require`;

export const sql = postgres(rawConnStr, {
  ssl: 'require',
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function parseBody(req: any): Promise<any> {
  try {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch (_) {
        return {};
      }
    }
  } catch (_) {}

  return new Promise((resolve) => {
    try {
      let raw = '';
      req.on('data', (chunk: any) => {
        raw += chunk;
      });
      req.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (_) {
          resolve({});
        }
      });
      req.on('error', () => resolve({}));
    } catch (_) {
      resolve({});
    }
  });
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
