const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getOverdueThresholdDays, annotateOverdue } = require('../utils/overdue');

const router = express.Router();

// GET /api/dashboard  (admin only) — totals by status, by category, overdue count
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const byStatusRes = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM complaints GROUP BY status`
    );
    const byCategoryRes = await pool.query(
      `SELECT category, COUNT(*)::int AS count FROM complaints GROUP BY category ORDER BY count DESC`
    );
    const totalRes = await pool.query(`SELECT COUNT(*)::int AS count FROM complaints`);

    // Overdue count needs the same logic as the list view, so compute it the
    // same way rather than duplicating SQL date math.
    const openComplaints = await pool.query(
      `SELECT id, status, created_at, is_overdue_flag FROM complaints WHERE status != 'Resolved'`
    );
    const threshold = await getOverdueThresholdDays();
    const annotated = annotateOverdue(openComplaints.rows, threshold);
    const overdueCount = annotated.filter((c) => c.is_overdue).length;

    res.json({
      totalComplaints: totalRes.rows[0].count,
      byStatus: byStatusRes.rows,
      byCategory: byCategoryRes.rows,
      overdueCount,
      overdueThresholdDays: threshold,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build dashboard' });
  }
});

module.exports = router;
