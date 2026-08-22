const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/email-logs (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_logs
       ORDER BY created_at DESC
       LIMIT 100`
    );

    res.json({
      logs: result.rows,
    });
  } catch (err) {
    console.error('Failed to fetch email logs:', err);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

module.exports = router;
