const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getOverdueThresholdDays } = require('../utils/overdue');

const router = express.Router();

// GET /api/settings/overdue-threshold  (admin)
router.get('/overdue-threshold', authenticate, requireAdmin, async (req, res) => {
  const days = await getOverdueThresholdDays();
  res.json({ days });
});

// PUT /api/settings/overdue-threshold  (admin) — { days: number }
router.put('/overdue-threshold', authenticate, requireAdmin, async (req, res) => {
  const { days } = req.body;
  if (!Number.isInteger(days) || days < 1) {
    return res.status(400).json({ error: 'days must be a positive integer' });
  }
  try {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('overdue_threshold_days', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [String(days)]
    );
    res.json({ days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

module.exports = router;
