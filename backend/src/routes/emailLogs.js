const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { autoMigrate } = require('../db/autoMigrate');
const { sendEmail } = require('../utils/email');

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

// POST /api/email-logs/test (admin only)
router.post('/test', authenticate, requireAdmin, async (req, res) => {
  try {
    const testResult = await sendEmail({
      to: 'resident@society.com',
      recipientName: 'John Resident (Demo)',
      subject: '[Angan Society] Test Audit Email Dispatch',
      text: 'This is an automated test dispatch from the Administrative Audit Console to verify email delivery logs.',
      eventType: 'Test Notification',
      senderId: req.user.id,
    });
    res.json({ message: 'Test email log generated successfully', result: testResult });
  } catch (err) {
    console.error('Failed to trigger test email:', err);
    res.status(500).json({ error: 'Failed to dispatch test email log' });
  }
});

module.exports = router;
