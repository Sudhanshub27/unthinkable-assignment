require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  try {
    await pool.query(schema);

    // Safely add body and provider_msg_id columns if table existed prior
    try {
      await pool.query('ALTER TABLE email_logs ADD COLUMN body TEXT');
    } catch (e) {}

    try {
      await pool.query('ALTER TABLE email_logs ADD COLUMN provider_msg_id VARCHAR(100)');
    } catch (e) {}

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
