const bcrypt = require('bcryptjs');
const pool = require('./pool');
require('dotenv').config();

async function seed() {
  try {
    // Clean up old tables
    await pool.query('DELETE FROM complaint_history');
    await pool.query('DELETE FROM complaints');
    await pool.query('DELETE FROM notices');
    await pool.query('DELETE FROM users');

    // Admin Demo Account
    const adminHash = await bcrypt.hash('Admin@123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      ['Society Admin', 'admin@society.com', adminHash]
    );

    // Resident Demo Account
    const residentHash = await bcrypt.hash('Resident@123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, flat_number) VALUES ($1, $2, $3, 'resident', $4)`,
      ['John Resident', 'resident@society.com', residentHash, 'A-301']
    );

    console.log('✅ Database cleaned & demo accounts seeded successfully:');
    console.log('   Admin:    admin@society.com    / Admin@123');
    console.log('   Resident: resident@society.com / Resident@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
