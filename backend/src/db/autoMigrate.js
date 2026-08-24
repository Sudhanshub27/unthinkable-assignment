const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

let migrationExecuted = false;

async function autoMigrate() {
  if (migrationExecuted) return;

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
    }

    // Safely add missing columns if tables pre-existed
    const colAlterations = [
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS body TEXT;',
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS provider_msg_id VARCHAR(100);',
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_details TEXT;',
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_number VARCHAR(20);',
    ];

    for (const sql of colAlterations) {
      try {
        await pool.query(sql);
      } catch (e) {
        // Fallback for Postgres versions without IF NOT EXISTS on ALTER TABLE
        try {
          const rawCol = sql.split('ADD COLUMN IF NOT EXISTS ')[1]?.split(' ')[0];
          if (rawCol) {
            await pool.query(`ALTER TABLE email_logs ADD COLUMN ${rawCol} TEXT`);
          }
        } catch (innerErr) {
          // Column already exists or error ignored
        }
      }
    }

    // Seed default settings rows idempotently
    try {
      await pool.query(`
        INSERT INTO settings (key, value) VALUES
          ('overdue_threshold_days', '5'),
          ('society_name', 'Unthinkable Sudhanshu Society'),
          ('support_email', 'office@sudhanshubatraunthinkable.com'),
          ('emergency_phone', '+91 98765 43210'),
          ('email_notifications', 'enabled'),
          ('max_upload_size_mb', '5')
        ON CONFLICT (key) DO NOTHING;
      `);
    } catch (settingsErr) {
      console.warn('Idempotent settings seed skipped:', settingsErr.message);
    }

    // Seed default admin demo user idempotently
    try {
      const adminRes = await pool.query("SELECT id FROM users WHERE email = 'admin@society.com'");
      if (adminRes.rows.length === 0) {
        const adminHash = await bcrypt.hash('Admin@123', 10);
        await pool.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING`,
          ['Society Admin', 'admin@society.com', adminHash]
        );
      }
    } catch (userErr) {
      console.warn('Idempotent admin seed skipped:', userErr.message);
    }

    // Seed default resident demo user idempotently
    try {
      const resRes = await pool.query("SELECT id FROM users WHERE email = 'resident@society.com'");
      if (resRes.rows.length === 0) {
        const residentHash = await bcrypt.hash('Resident@123', 10);
        await pool.query(
          `INSERT INTO users (name, email, password_hash, role, flat_number)
           VALUES ($1, $2, $3, 'resident', $4) ON CONFLICT (email) DO NOTHING`,
          ['John Resident', 'resident@society.com', residentHash, 'A-301']
        );
      }
    } catch (userErr) {
      console.warn('Idempotent resident seed skipped:', userErr.message);
    }

    migrationExecuted = true;
    console.log('✅ Automated database schema verification and seeding completed successfully.');
  } catch (err) {
    console.error('⚠️ Database auto-migration warning:', err.message);
  }
}

module.exports = { autoMigrate };
