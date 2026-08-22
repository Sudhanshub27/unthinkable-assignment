const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./db/pool');
const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const noticesRoutes = require('./routes/notices');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 4000;

const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin && process.env.NODE_ENV === 'production') {
  console.error('FATAL ERROR: CORS_ORIGIN environment variable is not defined in production!');
  process.exit(1);
}

app.use(
  cors({
    origin: corsOrigin || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded media with security headers
app.use(
  '/uploads',
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
