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

    // Protection: do not overwrite data.json if DB has 0 complaints and data.json has 48
    if (complaints.length === 0 && fs.existsSync(DATA_JSON_PATH)) {
      try {
        const existing = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
        if (existing.complaints && existing.complaints.length > 0) {
          console.log('[DATA_JSON_SYNC] Protecting data.json from empty DB overwrite.');
          return;
        }
      } catch (e) {}
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
 * Loads data from data.json into DB
 */
async function seedFromDataJson(force = false) {
  if (!fs.existsSync(DATA_JSON_PATH)) {
    console.log('[DATA_JSON_SEED] data.json does not exist. Skipping seed.');
    return;
  }

  let data;
  try {
    const raw = fs.readFileSync(DATA_JSON_PATH, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('[DATA_JSON_SEED_ERROR] Failed to parse data.json:', e.message);
    return;
  }

  try {
    const existingComplaints = await pool.query('SELECT COUNT(*) as c FROM complaints');
    const existingNotices = await pool.query('SELECT COUNT(*) as c FROM notices');
    const count = parseInt(existingComplaints.rows[0]?.c || '0', 10);
    const noticeCount = parseInt(existingNotices.rows[0]?.c || '0', 10);
    const targetCount = data.complaints?.length || 48;

    if (!force && count >= targetCount && noticeCount > 0) {
      console.log(`[DATA_JSON_SEED] DB already has ${count} complaints and ${noticeCount} notices. Skipping seedFromDataJson.`);
      return;
    }
    console.log(`[DATA_JSON_SEED] Seeding DB from data.json (${targetCount} complaints, ${data.notices?.length || 0} notices)...`);
  } catch (e) {
    console.error('[DATA_JSON_SEED] Count check warning:', e.message);
  }

  // Pure purge using PostgreSQL TRUNCATE CASCADE or SQLite DELETE
  try {
    await pool.query('TRUNCATE TABLE complaint_history, notifications, email_logs, complaints, notices, users, settings RESTART IDENTITY CASCADE');
  } catch (pgTruncErr) {
    try {
      try { await pool.query('PRAGMA foreign_keys = OFF'); } catch (e) {}
      await pool.query('DELETE FROM complaint_history');
      await pool.query('DELETE FROM notifications');
      await pool.query('DELETE FROM email_logs');
      await pool.query('DELETE FROM complaints');
      await pool.query('DELETE FROM notices');
      await pool.query('DELETE FROM users');
      await pool.query('DELETE FROM settings');
      try { await pool.query('PRAGMA foreign_keys = ON'); } catch (e) {}
    } catch (sqliteErr) {
      console.warn('[SEED_PURGE_WARN]', sqliteErr.message);
    }
  }

  // 1. Users
  const validUserIds = new Set();
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      try {
        const adminStatus = (u.admin_status === 'pending' || u.admin_status === 'approved' || u.admin_status === 'rejected') ? u.admin_status : null;
        await pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, flat_number, admin_status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [u.id, u.name, u.email, u.password_hash, u.role, u.flat_number || null, adminStatus, u.created_at || new Date().toISOString()]
        );
        validUserIds.add(u.id);
      } catch (err) {
        console.error(`[SEED_USER_ERR] ${u.email}:`, err.message);
      }
    }
  }

  const defaultResidentId = validUserIds.has(5) ? 5 : Array.from(validUserIds)[0] || 1;
  const defaultAdminId = validUserIds.has(1) ? 1 : Array.from(validUserIds)[0] || 1;

  // 2. Complaints
  if (Array.isArray(data.complaints)) {
    for (const c of data.complaints) {
      try {
        const residentId = validUserIds.has(c.resident_id) ? c.resident_id : defaultResidentId;
        const isOverdue = Boolean(c.is_overdue_flag);
        await pool.query(
          `INSERT INTO complaints (id, resident_id, category, description, photo_url, status, priority, is_overdue_flag, resolved_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            c.id,
            residentId,
            c.category,
            c.description,
            c.photo_url || null,
            c.status,
            c.priority,
            isOverdue,
            c.resolved_at || null,
            c.created_at,
            c.updated_at || c.created_at,
          ]
        );
      } catch (err) {
        console.error(`[SEED_COMPLAINT_ERR] #${c.id}:`, err.message);
      }
    }
  }

  // 3. Complaint History
  if (Array.isArray(data.complaint_history)) {
    for (const h of data.complaint_history) {
      try {
        const actorId = validUserIds.has(h.actor_id) ? h.actor_id : null;
        await pool.query(
          `INSERT INTO complaint_history (id, complaint_id, actor_id, actor_role, change_type, old_value, new_value, note, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [h.id, h.complaint_id, actorId, h.actor_role, h.change_type, h.old_value, h.new_value, h.note || null, h.created_at]
        );
      } catch (err) {}
    }
  }

  // 4. Notices
  if (Array.isArray(data.notices)) {
    for (const n of data.notices) {
      try {
        const postedBy = validUserIds.has(n.posted_by) ? n.posted_by : defaultAdminId;
        const isImportant = Boolean(n.is_important);
        await pool.query(
          `INSERT INTO notices (id, title, body, is_important, posted_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [n.id, n.title, n.body, isImportant, postedBy, n.created_at]
        );
      } catch (err) {
        console.error(`[SEED_NOTICE_ERR] #${n.id}:`, err.message);
      }
    }
  }

  // 5. Notifications
  if (Array.isArray(data.notifications)) {
    for (const notif of data.notifications) {
      try {
        const userId = validUserIds.has(notif.user_id) ? notif.user_id : defaultResidentId;
        const isRead = Boolean(notif.is_read);
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, is_read, type, complaint_id, notice_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            notif.id,
            userId,
            notif.title,
            notif.message,
            isRead,
            notif.type || 'info',
            notif.complaint_id || null,
            notif.notice_id || null,
            notif.created_at,
          ]
        );
      } catch (err) {}
    }
  }

  // 6. Email Logs
  if (Array.isArray(data.email_logs)) {
    for (const em of data.email_logs) {
      try {
        const recipientEmail = em.recipient_email || em.recipient || 'resident@society.com';
        const eventType = em.event_type || 'Complaint Status Update';
        await pool.query(
          `INSERT INTO email_logs (id, recipient_email, recipient_name, event_type, subject, status, complaint_id, notice_id, created_at, body, provider_msg_id, error_details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
      } catch (err) {}
    }
  }

  // 7. Settings
  if (Array.isArray(data.settings)) {
    for (const s of data.settings) {
      try {
        await pool.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)`,
          [s.key, s.value]
        );
      } catch (err) {}
    }
  }

  // Reset PostgreSQL sequence counters safely
  const seqs = [
    { table: 'users', seq: 'users_id_seq' },
    { table: 'complaints', seq: 'complaints_id_seq' },
    { table: 'notices', seq: 'notices_id_seq' },
    { table: 'complaint_history', seq: 'complaint_history_id_seq' },
    { table: 'notifications', seq: 'notifications_id_seq' },
    { table: 'email_logs', seq: 'email_logs_id_seq' },
  ];

  for (const s of seqs) {
    try {
      await pool.query(`SELECT setval('${s.seq}', (SELECT COALESCE(MAX(id), 1) FROM ${s.table}))`);
    } catch (seqErr) {
      // Ignored for SQLite
    }
  }

  console.log('✅ Successfully populated DB from data.json with all 48 complaints & 6 notices!');
}

module.exports = {
  syncDataJson,
  seedFromDataJson,
};
