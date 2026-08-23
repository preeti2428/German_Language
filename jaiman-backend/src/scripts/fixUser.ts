import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
dotenv.config();

/**
 * Reset a user's password (and optionally their role) from the terminal.
 *
 *   npx tsx src/scripts/fixUser.ts <email> <newPassword> [role]
 *   npx tsx src/scripts/fixUser.ts preeti@example.com MyPass123 admin
 *
 * Assigning user.password triggers the schema's pre-save hook, so the new
 * password is bcrypt-hashed exactly like a signup would.
 */
async function main() {
  const [email, password, role] = process.argv.slice(2);
  if (!email || !password) {
    console.log('Usage: npx tsx src/scripts/fixUser.ts <email> <newPassword> [role]');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jaiman');

  let user = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (!user) {
    console.log(`No existing user found with email "${email}". Creating new account...`);
    user = await User.create({
      name: email.split('@')[0] || 'User',
      email: email.toLowerCase(),
      password,
      role: (role as any) || 'admin',
    });
    console.log(`User created successfully: ${user.email} (role: ${user.role})`);
    await mongoose.disconnect();
    process.exit(0);
  }

  user.password = password;
  if (role) user.role = role as never;
  await user.save();

  console.log(`Done. ${user.email} → password reset${role ? `, role = ${role}` : ''}.`);
  console.log('Log in with the new password now.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
