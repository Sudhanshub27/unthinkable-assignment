const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { getJwtSecret } = require('../utils/jwt');
const { syncDataJson } = require('../db/syncDataJson');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, flatNumber, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'resident';
    const adminStatus = userRole === 'admin' ? 'pending' : null;

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, admin_status, flat_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, admin_status, flat_number, created_at`,
      [name, email.toLowerCase(), hash, userRole, adminStatus, flatNumber || null]
    );
    const user = result.rows[0];

    // Admin registration must NOT issue a token or log the user in immediately
    if (user.role === 'admin') {
      return res.status(201).json({
        requiresApproval: true,
        title: 'Admin Registration Submitted',
        message: 'Your admin account has been created and is awaiting approval from an existing administrator.',
        subMessage: 'Once approved, you can sign in using your registered email and password.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          admin_status: user.admin_status,
          flat_number: user.flat_number,
          created_at: user.created_at,
        },
      });
    }

    // Resident registration issues a token and logs in immediately
    const token = jwt.sign(
      { id: user.id, role: user.role, admin_status: user.admin_status, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
    syncDataJson().catch(() => {});
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check approval status for admin accounts
    if (user.role === 'admin') {
      if (user.admin_status === 'pending') {
        return res.status(403).json({
          error: 'Your admin account is still awaiting approval. Please ask an existing administrator to approve your account.',
        });
      }
      if (user.admin_status === 'rejected') {
        return res.status(403).json({
          error: 'Your admin access request was rejected. Please contact the society administrator.',
        });
      }
      if (user.admin_status !== 'approved') {
        return res.status(403).json({
          error: 'Your admin account is awaiting approval.',
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, admin_status: user.admin_status, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        admin_status: user.admin_status,
        flat_number: user.flat_number,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
