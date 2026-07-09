const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { success, token, expiresIn }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const passwordHash     = process.env.ADMIN_PASSWORD_HASH;

    if (!passwordHash) {
      return res.status(500).json({ success: false, message: 'Server auth not configured. Set ADMIN_PASSWORD_HASH in .env' });
    }

    if (username !== expectedUsername) {
      // Constant-time response to avoid user enumeration
      await bcrypt.compare(password, '$2a$12$fakehashtopreventtimingattacks00000000000000000000000000');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({ success: true, token, expiresIn, username });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/auth/me
 * Returns current user info (requires valid JWT — tested via middleware in server.js)
 */
router.get('/me', (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
