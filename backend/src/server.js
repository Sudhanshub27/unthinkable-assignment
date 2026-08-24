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
      // Always allow requests without origin (curl, server pings, health checks)
      if (!origin) return callback(null, true);

      // If CORS_ORIGIN is missing, wildcard, or default placeholder, permit all origins
      if (!corsOrigin || corsOrigin === '*' || corsOrigin.includes('your-app-name.vercel.app')) {
        return callback(null, true);
      }

      const allowedOrigins = corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, ''));
      const cleanOrigin = origin.replace(/\/$/, '');

      if (
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.includes('*') ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.endsWith('.onrender.com') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      // Fail-safe fallback to prevent blocking legitimate frontend requests
      return callback(null, true);
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
