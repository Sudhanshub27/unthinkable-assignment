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

// GET /api/complaints/:id  (detail + full history; resident can view own, admin can view any)
router.get('/:id', authenticate, async (req, res) => {
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

// PATCH /api/complaints/:id/status  (admin updates status; records history; sends email)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status, note } = req.body;
  const VALID = ['Open', 'In Progress', 'Resolved'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
  }

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

    const resolvedAt = status === 'Resolved' ? new Date() : existing.resolved_at;
    const updateRes = await client.query(
      `UPDATE complaints SET status = $1, resolved_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, resolvedAt, req.params.id]
    );

    await client.query(
      `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, old_value, new_value, note)
       VALUES ($1, $2, $3, 'status_change', $4, $5, $6)`,
      [req.params.id, req.user.id, req.user.role, oldStatus, status, note || null]
    );

    await client.query('COMMIT');

    // Email is best-effort: fire after commit so a slow/broken SMTP provider
    // never rolls back a valid status change.
    if (oldStatus !== status) {
      const { subject, text } = complaintStatusChangeEmail({
        residentName: existing.resident_name,
        complaintId: req.params.id,
        category: existing.category,
        oldStatus,
        newStatus: status,
        note,
      });
      sendEmail({ to: existing.resident_email, subject, text }).catch(() => {});
    }

    res.json(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  } finally {
    client.release();
  }
});

// PATCH /api/complaints/:id/priority  (admin sets priority)
router.patch('/:id/priority', authenticate, requireAdmin, async (req, res) => {
  const { priority } = req.body;
  const VALID = ['Low', 'Medium', 'High'];
  if (!VALID.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID.join(', ')}` });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingRes = await client.query('SELECT priority FROM complaints WHERE id = $1', [req.params.id]);
    if (existingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Complaint not found' });
    }
    const oldPriority = existingRes.rows[0].priority;
    const updateRes = await client.query(
      `UPDATE complaints SET priority = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [priority, req.params.id]
    );
    await client.query(
      `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, old_value, new_value)
       VALUES ($1, $2, $3, 'priority_change', $4, $5)`,
      [req.params.id, req.user.id, req.user.role, oldPriority, priority]
    );
    await client.query('COMMIT');
    res.json(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to update priority' });
  } finally {
    client.release();
  }
});

// PATCH /api/complaints/:id/overdue-flag  (admin manually flags/unflags as overdue)
router.patch('/:id/overdue-flag', authenticate, requireAdmin, async (req, res) => {
  const { flag } = req.body; // boolean
  try {
    const result = await pool.query(
      `UPDATE complaints SET is_overdue_flag = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [Boolean(flag), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update overdue flag' });
  }
});

router.get('/meta/categories', authenticate, (req, res) => res.json(CATEGORIES));

module.exports = router;
