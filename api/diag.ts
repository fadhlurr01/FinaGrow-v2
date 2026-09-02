export default async function handler(req: any, res: any) {
  try {
    const { sql } = await import('./_db.js');
    const result = await sql`SELECT count(*) FROM users`;
    res.status(200).json({ 
      success: true, 
      count: result[0].count, 
      db_url_set: Boolean(process.env.DATABASE_URL),
      env_length: (process.env.DATABASE_URL || '').length 
    });
  } catch (err: any) {
    res.status(200).json({ 
      success: false, 
      error: err.message, 
      stack: err.stack, 
      name: err.name,
      db_url_set: Boolean(process.env.DATABASE_URL) 
    });
  }
}
