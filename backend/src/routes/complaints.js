const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getOverdueThresholdDays, annotateOverdue } = require('../utils/overdue');
const { sendEmail, complaintStatusChangeEmail } = require('../utils/email');

const router = express.Router();
const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Security', 'Lift', 'Parking', 'Other'];

// POST /api/complaints  (resident creates a complaint, optional photo)
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  const { category, description } = req.body;
  if (!category || !description) {
    return res.status(400).json({ error: 'category and description are required' });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` });
  }

  const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO complaints (resident_id, category, description, photo_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, category, description, photoUrl]
    );
    const complaint = result.rows[0];

    // First history entry: creation
    await client.query(
      `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, new_value, note)
       VALUES ($1, $2, $3, 'created', 'Open', 'Complaint raised')`,
      [complaint.id, req.user.id, req.user.role]
    );

    await client.query('COMMIT');
    res.status(201).json(complaint);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create complaint' });
  } finally {
    client.release();
  }
});

// GET /api/complaints/mine  (resident's own complaints, with history)
router.get('/mine', authenticate, async (req, res) => {
  try {
    const complaintsRes = await pool.query(
      `SELECT * FROM complaints WHERE resident_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    const threshold = await getOverdueThresholdDays();
    const complaints = annotateOverdue(complaintsRes.rows, threshold);

    // Attach history to each complaint
    for (const c of complaints) {
      const historyRes = await pool.query(
        `SELECT h.*, u.name AS actor_name FROM complaint_history h
         LEFT JOIN users u ON u.id = h.actor_id
         WHERE h.complaint_id = $1 ORDER BY h.created_at ASC`,
        [c.id]
      );
      c.history = historyRes.rows;
    }
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET /api/complaints  (admin: view all, filter by category/status/date, overdue first)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { category, status, from, to } = req.query;
  const clauses = [];
  const params = [];

  if (category) {
    params.push(category);
    clauses.push(`category = $${params.length}`);
  }
  if (status) {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`created_at <= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS resident_name, u.flat_number
       FROM complaints c JOIN users u ON u.id = c.resident_id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    const threshold = await getOverdueThresholdDays();
    let complaints = annotateOverdue(result.rows, threshold);

    // Overdue complaints surface at the top of the admin view, as required.
    complaints.sort((a, b) => {
      if (a.is_overdue !== b.is_overdue) return a.is_overdue ? -1 : 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

function isValidId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 && String(num) === String(id);
}

// GET /api/complaints/:id  (detail + full history; resident can view own, admin can view any)
router.get('/:id', authenticate, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid complaint id' });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS resident_name, u.flat_number, u.email AS resident_email
       FROM complaints c JOIN users u ON u.id = c.resident_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
    const complaint = result.rows[0];

    if (req.user.role !== 'admin' && complaint.resident_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this complaint' });
    }

    const threshold = await getOverdueThresholdDays();
    const [annotated] = annotateOverdue([complaint], threshold);

    const historyRes = await pool.query(
      `SELECT h.*, u.name AS actor_name FROM complaint_history h
       LEFT JOIN users u ON u.id = h.actor_id
       WHERE h.complaint_id = $1 ORDER BY h.created_at ASC`,
      [req.params.id]
    );
    annotated.history = historyRes.rows;
    res.json(annotated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// PATCH /api/complaints/:id  (Atomic Admin Triage: status, priority, is_overdue, note in single transaction)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid complaint id' });
  }

  const { status, priority, is_overdue, is_overdue_flag, note } = req.body;

  const VALID_STATUS = ['Open', 'In Progress', 'Resolved'];
  if (status !== undefined && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` });
  }

  const VALID_PRIORITY = ['Low', 'Medium', 'High'];
  if (priority !== undefined && !VALID_PRIORITY.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITY.join(', ')}` });
  }

  const overdueVal = is_overdue !== undefined ? is_overdue : is_overdue_flag;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingRes = await client.query(
      `SELECT c.*, u.name AS resident_name, u.email AS resident_email
       FROM complaints c JOIN users u ON u.id = c.resident_id WHERE c.id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (existingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const existing = existingRes.rows[0];
    const oldStatus = existing.status;
    const oldPriority = existing.priority;
    const oldOverdueFlag = Boolean(existing.is_overdue_flag);

    const statusChanged = status !== undefined && status !== oldStatus;
    const priorityChanged = priority !== undefined && priority !== oldPriority;
    const overdueChanged = overdueVal !== undefined && Boolean(overdueVal) !== oldOverdueFlag;
    const noteText = note ? note.trim() : '';
    const hasNote = noteText.length > 0;

    const newStatus = statusChanged ? status : oldStatus;
    const newPriority = priorityChanged ? priority : oldPriority;
    const newOverdueFlag = overdueChanged ? Boolean(overdueVal) : oldOverdueFlag;

    let resolvedAt = existing.resolved_at;
    if (statusChanged) {
      resolvedAt = newStatus === 'Resolved' ? new Date() : null;
    }

    // Single atomic update of all complaint fields
    const updateRes = await client.query(
      `UPDATE complaints
       SET status = $1, priority = $2, is_overdue_flag = $3, resolved_at = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [newStatus, newPriority, newOverdueFlag, resolvedAt, req.params.id]
    );

    // Track attached note state to avoid note duplication across events
    let noteAttachedToEvent = false;

    if (statusChanged) {
      await client.query(
        `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, old_value, new_value, note)
         VALUES ($1, $2, $3, 'status_change', $4, $5, $6)`,
        [req.params.id, req.user.id, req.user.role, oldStatus, newStatus, hasNote ? noteText : null]
      );
      noteAttachedToEvent = true;
    }

    if (priorityChanged) {
      await client.query(
        `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, old_value, new_value, note)
         VALUES ($1, $2, $3, 'priority_change', $4, $5, $6)`,
        [
          req.params.id,
          req.user.id,
          req.user.role,
          oldPriority,
          newPriority,
          hasNote && !noteAttachedToEvent ? noteText : null,
        ]
      );
      noteAttachedToEvent = true;
    }

    if (overdueChanged) {
      await client.query(
        `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, old_value, new_value, note)
         VALUES ($1, $2, $3, 'overdue_flag', $4, $5, $6)`,
        [
          req.params.id,
          req.user.id,
          req.user.role,
          oldOverdueFlag ? 'Flagged' : 'Normal',
          newOverdueFlag ? 'Flagged' : 'Normal',
          hasNote && !noteAttachedToEvent ? noteText : null,
        ]
      );
      noteAttachedToEvent = true;
    }

    // If only a note was added without any field changes
    if (hasNote && !noteAttachedToEvent) {
      await client.query(
        `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, note)
         VALUES ($1, $2, $3, 'note_added', $4)`,
        [req.params.id, req.user.id, req.user.role, noteText]
      );
    }

    await client.query('COMMIT');

    // Non-blocking email trigger on status change
    if (statusChanged && existing.resident_email) {
      const { subject, text } = complaintStatusChangeEmail({
        residentName: existing.resident_name,
        complaintId: req.params.id,
        category: existing.category,
        oldStatus,
        newStatus,
        note: hasNote ? noteText : undefined,
      });
      sendEmail({ to: existing.resident_email, subject, text }).catch(() => {});
    }

    const threshold = await getOverdueThresholdDays();
    const [annotated] = annotateOverdue(updateRes.rows, threshold);
    res.json(annotated);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Atomic triage update failed:', err);
    res.status(500).json({ error: 'Failed to update complaint' });
  } finally {
    client.release();
  }
});

router.get('/meta/categories', authenticate, (req, res) => res.json(CATEGORIES));

module.exports = router;
