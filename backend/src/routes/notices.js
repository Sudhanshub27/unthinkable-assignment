const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendEmail, importantNoticeEmail } = require('../utils/email');

const router = express.Router();

// GET /api/notices  (everyone; important notices pinned to top, then newest first)
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name AS posted_by_name FROM notices n
       LEFT JOIN users u ON u.id = n.posted_by
       ORDER BY n.is_important DESC, n.created_at DESC`
    );
    // Convert is_important to boolean for consistent client handling across DB drivers
    const notices = result.rows.map((n) => ({
      ...n,
      is_important: n.is_important === true || n.is_important === 1 || n.is_important === '1',
    }));
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

// POST /api/notices  (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { title, body } = req.body;
  const isImp = req.body.is_important !== undefined ? req.body.is_important : req.body.isImportant;
  const isImportantFlag = Boolean(isImp);

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO notices (title, body, is_important, posted_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, body, isImportantFlag ? 1 : 0, req.user.id]
    );
    const rawNotice = result.rows[0];
    const notice = {
      ...rawNotice,
      is_important: Boolean(isImportantFlag),
    };

    if (notice.is_important) {
      // Best-effort broadcast to all residents; failures are logged, not thrown,
      // so one bad email address never blocks notice creation.
      const residents = await pool.query(`SELECT name, email FROM users WHERE role = 'resident'`);
      for (const resident of residents.rows) {
        const { subject, text } = importantNoticeEmail({
          residentName: resident.name,
          title: notice.title,
          body: notice.body,
        });
        sendEmail({ to: resident.email, subject, text }).catch(() => {});
      }
    }

    res.status(201).json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

// DELETE /api/notices/:id  (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM notices WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notice not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

module.exports = router;
