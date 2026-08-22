const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications (authenticated user)
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const unreadRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    const unreadCount = unreadRes.rows[0] ? parseInt(unreadRes.rows[0].count, 10) || 0 : 0;
    
    // Normalize is_read to boolean for consistent JS handling across DB engines
    const notifications = result.rows.map((n) => ({
      ...n,
      is_read: n.is_read === true || n.is_read === 1 || n.is_read === '1',
    }));

    res.json({
      notifications,
      unread_count: unreadCount,
    });
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/read-all (authenticated user)
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// PATCH /api/notifications/:id/read (authenticated user)
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = {
      ...result.rows[0],
      is_read: true,
    };

    res.json(updated);
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
