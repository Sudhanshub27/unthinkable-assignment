const pool = require('../db/pool');

// Overdue = complaint is still open (not Resolved) and has been open longer
// than the configurable threshold (in days), counted from created_at.
// Threshold lives in the `settings` table so admin can change it without a
// code deploy (exposed via GET/PUT /api/settings/overdue-threshold).
async function getOverdueThresholdDays() {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'overdue_threshold_days'`);
  if (result.rows.length === 0) return 5; // sane default
  const parsed = parseInt(result.rows[0].value, 10);
  return isNaN(parsed) ? 5 : parsed;
}

// Appends a computed `is_overdue` boolean to each complaint row.
// A complaint is overdue if: status != 'Resolved' AND age_in_days >= threshold,
// OR the admin manually flagged it via is_overdue_flag (while status != 'Resolved').
function annotateOverdue(complaints, thresholdDays) {
  const now = Date.now();
  const threshold = Number(thresholdDays) || 5;

  return complaints.map((c) => {
    const ageMs = Math.max(0, now - new Date(c.created_at).getTime());
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    
    // Auto overdue if unresolved and age exceeds threshold
    const autoOverdue = c.status !== 'Resolved' && ageDays >= threshold;
    const manualOverdue = c.status !== 'Resolved' && (c.is_overdue_flag === true || c.is_overdue_flag === 1);

    return {
      ...c,
      is_overdue: autoOverdue || manualOverdue,
      is_auto_overdue: autoOverdue,
      age_days: ageDays,
    };
  });
}

module.exports = { getOverdueThresholdDays, annotateOverdue };
