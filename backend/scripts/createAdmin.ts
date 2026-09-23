/**
 * One-time setup script to create the first admin account against the
 * Supabase database. There is no hardcoded default admin/password anymore —
 * you supply the credentials yourself, via environment variables.
 *
 * Usage (from the backend/ directory, after `npm install` and after
 * backend/.env is filled in with your Supabase credentials):
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_USERNAME=admin ADMIN_PASSWORD='a-strong-password' \
 *     npx ts-node scripts/createAdmin.ts
 *
 * If the email already exists, the script just promotes that account to the
 * "admin" role instead of creating a duplicate.
 */
import 'dotenv/config';
import { dbService } from '../dbService';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !username || !password) {
    console.error(
      'Missing required env vars. Set ADMIN_EMAIL, ADMIN_USERNAME and ADMIN_PASSWORD and re-run.'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD should be at least 8 characters.');
    process.exit(1);
  }

  const existing = await dbService.getUserByEmail(email);
  if (existing) {
    await dbService.setUserRole(Number(existing.id), 'admin');
    console.log(`Existing user ${email} promoted to admin.`);
    return;
  }

  const user = await dbService.createUser(email, password, username);
  await dbService.setUserRole(Number(user.id), 'admin');
  console.log(`Admin account created: ${user.email} (username: ${user.username})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to create admin account:', error);
    process.exit(1);
  });
