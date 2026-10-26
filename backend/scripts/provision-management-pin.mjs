// One-time bootstrap for EXISTING Superadmin/Admin/Staff accounts.
// Run locally from backend after applying SQL migration. Do not commit its output.
// Usage (PowerShell): $env:MANAGEMENT_SETUP_EMAIL='existing@example.com'; node scripts/provision-management-pin.mjs
import 'dotenv/config';
import { createHmac, randomInt } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const email = process.env.MANAGEMENT_SETUP_EMAIL?.trim().toLowerCase();
if (!email) throw new Error('Set MANAGEMENT_SETUP_EMAIL for an existing management account.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query('SELECT id, role, "isActive" FROM public."user" WHERE lower(email) = $1', [email]);
  const user = result.rows[0];
  if (!user || !user.isActive || !['SUPERADMIN', 'ADMIN', 'STAFF'].includes(String(user.role).toUpperCase().replace(/[\s_-]+/g, ''))) {
    throw new Error('No active management account matches the email');
  }
  let pin;
  do { pin = randomInt(100000, 1000000).toString(); }
  while (/^(\d)\1{5}$/.test(pin) || ['123456', '654321', '000000'].includes(pin));
  const pepper = process.env.MANAGEMENT_PIN_PEPPER;
  if (!pepper || pepper.length < 32) throw new Error('Set MANAGEMENT_PIN_PEPPER in backend/.env (32+ random characters).');
  const digest = createHmac('sha256', pepper).update(pin).digest('hex');
  const hash = await bcrypt.hash(digest, 12);
  const inserted = await pool.query(`INSERT INTO public.management_security (user_id, pin_hash, needs_setup)
    VALUES ($1, $2, TRUE) ON CONFLICT (user_id) DO NOTHING RETURNING user_id`, [user.id, hash]);
  if (!inserted.rowCount) throw new Error('Management PIN already provisioned. No change was made.');
  process.stdout.write(`\nProvisioned ${email}. TEMPORARY PIN (SHOW ONCE): ${pin}\n`);
  process.stdout.write('Share privately with the account owner. They must complete first-login setup after PIN verification.\n');
} finally {
  await pool.end();
}
