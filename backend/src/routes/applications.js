const express = require('express');
const db      = require('../config/db');
const router  = express.Router();

// ─── GET /api/applications ─────────────────────────────────────────────────────
// All applied jobs, including those closed by employer
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        j.*,
        a.id           AS applied_id,
        a.applied_date,
        a.notes        AS applied_notes,
        a.closed_by_employer
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      ORDER BY j.is_active DESC, a.applied_date DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Applications] GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
});

// ─── GET /api/applications/ingestion-log ─────────────────────────────────────
// Recent ingestion run history
router.get('/ingestion-log', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const [rows] = await db.query(
      `SELECT * FROM ingestion_log ORDER BY run_at DESC LIMIT ?`,
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Applications] Ingestion log error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch ingestion log.' });
  }
});

module.exports = router;
