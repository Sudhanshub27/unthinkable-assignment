const pool = require('../db/pool');

// Overdue = complaint is still open (not Resolved) and has been open longer
// than the configurable threshold (in days), counted from created_at.
// Threshold lives in the `settings` table so admin can change it without a
// code deploy (exposed via GET/PUT /api/settings/overdue-threshold).
async function getOverdueThresholdDays() {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'overdue_threshold_days'`);
  if (result.rows.length === 0) return 5; // sane default
  return parseInt(result.rows[0].value, 10);
}

// Appends a computed `is_overdue` boolean to each complaint row.
// A complaint is overdue if: status != 'Resolved' AND age_in_days > threshold,
// OR the admin manually flagged it via is_overdue_flag.
function annotateOverdue(complaints, thresholdDays) {
  const now = Date.now();
  return complaints.map((c) => {
    const ageMs = now - new Date(c.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const autoOverdue = c.status !== 'Resolved' && ageDays > thresholdDays;
    return {
      ...c,
      is_overdue: autoOverdue || c.is_overdue_flag,
      age_days: Math.floor(ageDays),
    };
  });
}

module.exports = { getOverdueThresholdDays, annotateOverdue };
