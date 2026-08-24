require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  try {
    await pool.query(schema);

    // Safely add missing columns if tables pre-existed in Postgres
    const safeAlterations = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_status VARCHAR(20);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_number VARCHAR(20);',
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS body TEXT;',
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS provider_msg_id VARCHAR(100);',
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150);',
      'ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_details TEXT;',
    ];

    for (const sql of safeAlterations) {
      try {
        await pool.query(sql);
      } catch (e) {
        // Fallback for drivers/DB versions without IF NOT EXISTS syntax
      }
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    if (pool.end) {
      try { await pool.end(); } catch (e) {}
    }
  }
}

migrate();
