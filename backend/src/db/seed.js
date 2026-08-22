const bcrypt = require('bcryptjs');
const pool = require('./pool');
require('dotenv').config();

// Creates a default admin account so you can log in immediately after deploy.
// Change these via env vars, or just change the password after first login.
async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@society.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const name = 'Society Admin';

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Admin user already exists:', email);
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      [name, email, hash]
    );
    console.log('Admin user created:');
    console.log('  email:', email);
    console.log('  password:', password);
    console.log('Please log in and change the password if this is a real deployment.');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
