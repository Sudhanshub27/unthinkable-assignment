const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const DATA_JSON_PATH = path.join(__dirname, 'data.json');

/**
 * Exports current database tables into data.json
 */
async function syncDataJson() {
  try {
    const users = (await pool.query('SELECT * FROM users ORDER BY id ASC')).rows;
    const complaints = (await pool.query('SELECT * FROM complaints ORDER BY id ASC')).rows;
    const complaint_history = (await pool.query('SELECT * FROM complaint_history ORDER BY id ASC')).rows;
    const notices = (await pool.query('SELECT * FROM notices ORDER BY id ASC')).rows;
    const notifications = (await pool.query('SELECT * FROM notifications ORDER BY id ASC')).rows;
    const email_logs = (await pool.query('SELECT * FROM email_logs ORDER BY id ASC')).rows;
    const settings = (await pool.query('SELECT * FROM settings ORDER BY key ASC')).rows;

    // Only overwrite data.json if there are complaints OR if data.json doesn't exist
    if (complaints.length === 0 && fs.existsSync(DATA_JSON_PATH)) {
      const existing = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
      if (existing.complaints && existing.complaints.length > 0) {
        console.log('[DATA_JSON_SYNC] Skipping sync to protect existing data.json records from empty DB overwrite.');
        return;
      }
    }

    const data = {
      users,
      complaints,
      complaint_history,
      notices,
      notifications,
      email_logs,
      settings,
      last_synced_at: new Date().toISOString(),
    };

    fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[DATA_JSON_SYNC] Synced ${complaints.length} complaints, ${notices.length} notices to data.json`);
  } catch (err) {
    console.error('[DATA_JSON_SYNC_ERROR]', err.message);
  }
}

/**
 * Loads data from data.json into DB if DB is empty or missing data
 */
async function seedFromDataJson() {
  try {
    if (!fs.existsSync(DATA_JSON_PATH)) {
      console.log('[DATA_JSON_SEED] data.json does not exist. Skipping seed.');
      return;
    }

    const raw = fs.readFileSync(DATA_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);

    const existingComplaints = await pool.query('SELECT COUNT(*) as c FROM complaints');
    const count = parseInt(existingComplaints.rows[0]?.c || '0', 10);

    const targetCount = data.complaints?.length || 48;
    if (count >= targetCount) {
      console.log(`[DATA_JSON_SEED] DB already has ${count} complaints. Skipping seedFromDataJson.`);
      return;
    }

    console.log(`[DATA_JSON_SEED] Seeding DB from data.json (${targetCount} complaints)...`);

    // 1. Users
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        await pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, flat_number, admin_status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             flat_number = EXCLUDED.flat_number,
             admin_status = EXCLUDED.admin_status`,
          [u.id, u.name, u.email, u.password_hash, u.role, u.flat_number || null, u.admin_status || null, u.created_at || new Date().toISOString()]
        );
      }
    }

    // 2. Complaints
    if (Array.isArray(data.complaints)) {
      for (const c of data.complaints) {
        await pool.query(
          `INSERT INTO complaints (id, resident_id, category, description, photo_url, status, priority, is_overdue_flag, resolved_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             category = EXCLUDED.category,
             description = EXCLUDED.description,
             photo_url = EXCLUDED.photo_url,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             is_overdue_flag = EXCLUDED.is_overdue_flag,
             resolved_at = EXCLUDED.resolved_at,
             updated_at = EXCLUDED.updated_at`,
          [
            c.id,
            c.resident_id,
            c.category,
            c.description,
            c.photo_url || null,
            c.status,
            c.priority,
            c.is_overdue_flag ? true : false,
            c.resolved_at || null,
            c.created_at,
            c.updated_at || c.created_at,
          ]
        );
      }
    }

    // 3. Complaint History
    if (Array.isArray(data.complaint_history)) {
      for (const h of data.complaint_history) {
        await pool.query(
          `INSERT INTO complaint_history (id, complaint_id, actor_id, actor_role, change_type, old_value, new_value, note, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [h.id, h.complaint_id, h.actor_id, h.actor_role, h.change_type, h.old_value, h.new_value, h.note || null, h.created_at]
        );
      }
    }

    // 4. Notices
    if (Array.isArray(data.notices)) {
      for (const n of data.notices) {
        await pool.query(
          `INSERT INTO notices (id, title, body, is_important, posted_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             body = EXCLUDED.body,
             is_important = EXCLUDED.is_important`,
          [n.id, n.title, n.body, n.is_important ? true : false, n.posted_by, n.created_at]
        );
      }
    }

    // 5. Notifications
    if (Array.isArray(data.notifications)) {
      for (const notif of data.notifications) {
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, is_read, type, complaint_id, notice_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            notif.id,
            notif.user_id,
            notif.title,
            notif.message,
            notif.is_read ? true : false,
            notif.type || 'info',
            notif.complaint_id || null,
            notif.notice_id || null,
            notif.created_at,
          ]
        );
      }
    }

    // 6. Email Logs
    if (Array.isArray(data.email_logs)) {
      for (const em of data.email_logs) {
        const recipientEmail = em.recipient_email || em.recipient || 'resident@society.com';
        const eventType = em.event_type || 'Complaint Status Update';
        await pool.query(
          `INSERT INTO email_logs (id, recipient_email, recipient_name, event_type, subject, status, complaint_id, notice_id, created_at, body, provider_msg_id, error_details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING`,
          [
            em.id,
            recipientEmail,
            em.recipient_name || null,
            eventType,
            em.subject || 'Notice',
            em.status || 'sent',
            em.complaint_id || null,
            em.notice_id || null,
            em.created_at || new Date().toISOString(),
            em.body || null,
            em.provider_msg_id || null,
            em.error_details || null,
          ]
        );
      }
    }

    // 7. Settings
    if (Array.isArray(data.settings)) {
      for (const s of data.settings) {
        await pool.query(
          `INSERT INTO settings (key, value)
           VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [s.key, s.value]
        );
      }
    }

    console.log('✅ Successfully populated DB from data.json!');
  } catch (err) {
    console.error('[DATA_JSON_SEED_ERROR]', err);
  }
}

module.exports = {
  syncDataJson,
  seedFromDataJson,
};
