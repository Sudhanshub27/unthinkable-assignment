const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { autoMigrate } = require('../db/autoMigrate');

const router = express.Router();

// GET /api/email-logs (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `SELECT * FROM email_logs
         ORDER BY created_at DESC
         LIMIT 100`
      );
    } catch (dbErr) {
      console.warn('email_logs table query failed, running autoMigrate...', dbErr.message);
      await autoMigrate();
      result = await pool.query(
        `SELECT * FROM email_logs
         ORDER BY created_at DESC
         LIMIT 100`
      );
    }

    res.json({
      logs: result ? result.rows : [],
    });
  } catch (err) {
    console.error('Failed to fetch email logs, serving empty array fallback:', err);
    res.json({ logs: [] });
  }
});

module.exports = router;
