const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./db/pool');
const { autoMigrate } = require('./db/autoMigrate');
const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const noticesRoutes = require('./routes/notices');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const notificationsRoutes = require('./routes/notifications');
const emailLogsRoutes = require('./routes/emailLogs');

const app = express();
const PORT = process.env.PORT || 4000;

// Run database migrations on server boot
autoMigrate().catch((err) => console.error('Startup migration error:', err));

const corsOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // If wildcard or unconfigured, permit request
      if (!corsOrigin || corsOrigin === '*') return callback(null, true);

      const allowedOrigins = corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, ''));
      const cleanOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Dynamic fallback for Vercel deployment preview domains
      if (cleanOrigin.endsWith('.vercel.app') || cleanOrigin.endsWith('.onrender.com')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded media with security headers
app.use(
  ['/uploads', '/api/uploads'],
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('Content-Disposition', 'inline');
    next();
  },
  express.static(path.join(__dirname, '..', 'uploads'))
);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/email-logs', emailLogsRoutes);

// Multer and general error middleware
app.use((err, req, res, next) => {
  if (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Something went wrong' });
  }
  next();
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Society Maintenance Tracker API running on port ${PORT}`);
});
