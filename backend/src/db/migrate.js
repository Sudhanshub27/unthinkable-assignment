require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  try {
    await pool.query(schema);

    // Safely add missing columns if tables pre-existed in Postgres or SQLite
    const safeAlterations = [
      'ALTER TABLE users ADD COLUMN admin_status VARCHAR(20)',
      'ALTER TABLE users ADD COLUMN flat_number VARCHAR(20)',
      'ALTER TABLE email_logs ADD COLUMN body TEXT',
      'ALTER TABLE email_logs ADD COLUMN provider_msg_id VARCHAR(100)',
      'ALTER TABLE email_logs ADD COLUMN recipient_name VARCHAR(150)',
      'ALTER TABLE email_logs ADD COLUMN error_details TEXT',
    ];

    for (const sql of safeAlterations) {
      try {
        await pool.query(sql);
      } catch (e) {
        // Ignored if column already exists
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
