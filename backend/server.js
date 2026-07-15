/**
 * JobPulse — Express API Server
 * Serves the REST API and optionally the React SPA in production.
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const jobsRouter        = require('./src/routes/jobs');
const applicationsRouter= require('./src/routes/applications');
const { startScheduler } = require('./src/scheduler/cron');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// ─── Security / Middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled — SPA handles its own CSP
}));

app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  
  let isAllowed = false;
  if (!origin) {
    isAllowed = true;
  } else if (allowedOrigins.includes(origin)) {
    isAllowed = true;
  } else {
    try {
      const originHost = new URL(origin).host;
      if (originHost === req.headers.host) {
        isAllowed = true;
      }
    } catch (_) {}
  }

  if (isAllowed) {
    callback(null, { origin: true, credentials: true });
  } else {
    callback(new Error(`CORS blocked: ${origin}`));
  }
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — slow down.' },
});
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
// Public: no authentication required
app.use('/api/jobs',           jobsRouter);
app.use('/api/applications',   applicationsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 JobPulse API running at http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  startScheduler();
});

module.exports = app;
