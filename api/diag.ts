import { sql, parseBody } from './_db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req: any, res: any) {
  try {
    const body = parseBody(req);
    const { name = 'Test', email = 'test' + Date.now() + '@gmail.com', password = '123' } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [newUser] = await sql`
      INSERT INTO users (name, email, password, role, is_pro, is_banned, api_token, created_at, updated_at)
      VALUES (${name}, ${email}, ${hashedPassword}, 'user', false, false, ${'tok_' + Date.now()}, NOW(), NOW())
      RETURNING *
    `;

    res.status(200).json({ success: true, newUser });
  } catch (err: any) {
    res.status(200).json({ success: false, error: err.message, stack: err.stack, name: err.name });
  }
}
