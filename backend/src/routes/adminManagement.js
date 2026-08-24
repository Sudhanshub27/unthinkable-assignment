const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { syncDataJson } = require('../db/syncDataJson');

const router = express.Router();

// GET /api/admin/pending-admins
router.get('/pending-admins', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, flat_number, role, admin_status, created_at
       FROM users
       WHERE role = 'admin' AND admin_status = 'pending'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending admin requests:', err);
    res.status(500).json({ error: 'Failed to fetch pending admin requests' });
  }
});

// GET /api/admin/all-admins
router.get('/all-admins', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, flat_number, role, admin_status, created_at
       FROM users
       WHERE role = 'admin'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all admins:', err);
    res.status(500).json({ error: 'Failed to fetch all admins' });
  }
});

// PATCH /api/admin/pending-admins/:id/approve
router.patch('/pending-admins/:id/approve', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const targetRes = await pool.query(
      'SELECT id, name, email, role, admin_status FROM users WHERE id = $1',
      [id]
    );

    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const targetUser = targetRes.rows[0];

    if (targetUser.role !== 'admin') {
      return res.status(400).json({ error: 'Target account is not an administrator' });
    }

    if (targetUser.admin_status === 'approved') {
      return res.status(400).json({ error: 'Admin account is already approved' });
    }

    if (targetUser.admin_status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve account with status: ${targetUser.admin_status}` });
    }

    const updateRes = await pool.query(
      `UPDATE users
       SET admin_status = 'approved'
       WHERE id = $1
       RETURNING id, name, email, role, admin_status, flat_number, created_at`,
      [id]
    );

    const updatedUser = updateRes.rows[0];

    res.json({
      message: 'Admin access approved successfully.',
      user: updatedUser,
    });
    syncDataJson().catch(() => {});
  } catch (err) {
    console.error('Error approving admin request:', err);
    res.status(500).json({ error: 'Failed to approve admin request' });
  }
});

// PATCH /api/admin/pending-admins/:id/reject
router.patch('/pending-admins/:id/reject', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const targetRes = await pool.query(
      'SELECT id, name, email, role, admin_status FROM users WHERE id = $1',
      [id]
    );

    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const targetUser = targetRes.rows[0];

    if (targetUser.admin_status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject account with status: ${targetUser.admin_status}` });
    }

    const updateRes = await pool.query(
      `UPDATE users
       SET admin_status = 'rejected'
       WHERE id = $1
       RETURNING id, name, email, role, admin_status, flat_number, created_at`,
      [id]
    );

    const updatedUser = updateRes.rows[0];

    res.json({
      message: 'Admin request rejected.',
      user: updatedUser,
    });
    syncDataJson().catch(() => {});
  } catch (err) {
    console.error('Error rejecting admin request:', err);
    res.status(500).json({ error: 'Failed to reject admin request' });
  }
});

module.exports = router;
