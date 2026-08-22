const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getOverdueThresholdDays } = require('../utils/overdue');

const router = express.Router();

const DEFAULT_SETTINGS = {
  overdue_threshold_days: '5',
  society_name: 'Unthinkable Sudhanshu Society',
  support_email: 'office@sudhanshubatraunthinkable.com',
  emergency_phone: '+91 98765 43210',
  email_notifications: 'enabled',
  max_upload_size_mb: '5',
};

// GET /api/settings (admin/auth - returns all settings object)
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settingsMap = { ...DEFAULT_SETTINGS };
    result.rows.forEach((row) => {
      settingsMap[row.key] = row.value;
    });
    res.json(settingsMap);
  } catch (err) {
    console.error('Failed to fetch settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings (admin - update multiple settings)
router.put('/', authenticate, requireAdmin, async (req, res) => {
  const newSettings = req.body.settings || req.body;
  if (!newSettings || typeof newSettings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload' });
  }

  // Validation: overdue threshold
  if (newSettings.overdue_threshold_days !== undefined) {
    const daysNum = parseInt(newSettings.overdue_threshold_days, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({ error: 'overdue_threshold_days must be a positive integer (minimum 1 day)' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, val] of Object.entries(newSettings)) {
      if (typeof val === 'string' || typeof val === 'number') {
        await client.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`,
          [String(key), String(val)]
        );
      }
    }
    await client.query('COMMIT');

    const result = await pool.query('SELECT key, value FROM settings');
    const updatedMap = { ...DEFAULT_SETTINGS };
    result.rows.forEach((row) => {
      updatedMap[row.key] = row.value;
    });
    res.json(updatedMap);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  } finally {
    client.release();
  }
});

// GET /api/settings/overdue-threshold (admin - legacy compatibility)
router.get('/overdue-threshold', authenticate, requireAdmin, async (req, res) => {
  const days = await getOverdueThresholdDays();
  res.json({ days });
});

// PUT /api/settings/overdue-threshold (admin - legacy compatibility)
router.put('/overdue-threshold', authenticate, requireAdmin, async (req, res) => {
  const daysNum = parseInt(req.body.days, 10);
  if (isNaN(daysNum) || daysNum < 1) {
    return res.status(400).json({ error: 'days must be a positive integer (minimum 1 day)' });
  }
  try {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('overdue_threshold_days', $1)
       ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`,
      [String(daysNum)]
    );
    res.json({ days: daysNum });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

module.exports = router;
