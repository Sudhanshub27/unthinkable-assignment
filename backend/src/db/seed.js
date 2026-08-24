require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  try {
    console.log('⏳ Emptying database tables completely...');
    await pool.query('DELETE FROM complaint_history');
    await pool.query('DELETE FROM complaints');
    await pool.query('DELETE FROM notices');
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM email_logs');
    await pool.query('DELETE FROM users');

    console.log('👥 Seeding baseline authentication accounts...');
    // Baseline Admin Demo Account
    const adminHash = await bcrypt.hash('Admin@123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, admin_status) VALUES ($1, $2, $3, 'admin', 'approved')`,
      ['Society Admin', 'admin@society.com', adminHash]
    );

    // Baseline Resident Demo Account
    const residentHash = await bcrypt.hash('Resident@123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, flat_number) VALUES ($1, $2, $3, 'resident', $4)`,
      ['John Resident', 'resident@society.com', residentHash, 'A-301']
    );

    console.log('✅ Database completely emptied of complaints, notices, notifications & email logs!');
    console.log('   Baseline Login Credentials:');
    console.log('   Admin:    admin@society.com    / Admin@123');
    console.log('   Resident: resident@society.com / Resident@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database cleanup failed:', err);
    process.exit(1);
  }
}

seed();
