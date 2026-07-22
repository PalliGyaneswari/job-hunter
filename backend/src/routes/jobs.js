const express = require('express');
const db      = require('../config/db');
const { runPipeline } = require('../ingestion/pipeline');
const router  = express.Router();

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────
// Query params:
//   tab        = 'all' | 'priority' | 'closed'  (default: 'all')
//   category   = role_category ENUM value
//   location   = location filter substring
//   search     = full-text search on title/company
//   page       = page number (default: 1)
//   limit      = results per page (default: 20, max: 50)
router.get('/', async (req, res) => {
  try {
    const tab      = req.query.tab      || 'all';
    const category = req.query.category || '';
    const location = req.query.location || '';
    const search   = req.query.search   || '';
    const page     = Math.max(1, parseInt(req.query.page  || '1'));
    const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
    const offset   = (page - 1) * limit;

    const conditions = [];
    const params     = [];

    // Tab logic
    if (tab === 'priority') {
      conditions.push('j.is_priority = 1');
      conditions.push('j.is_active = 1');
    } else if (tab === 'closed') {
      conditions.push('j.is_active = 0');
    } else {
      // 'all' tab — only active, non-applied jobs
      conditions.push('j.is_active = 1');
      conditions.push('a.id IS NULL'); // exclude applied
    }

    if (category) {
      conditions.push('j.role_category = ?');
      params.push(category);
    }

    if (location) {
      conditions.push('j.location LIKE ?');
      params.push(`%${location}%`);
    }

    if (search) {
      conditions.push('(j.title LIKE ? OR j.company LIKE ? OR j.description_snippet LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ORDER: priority first, then by posted_date desc
    const orderClause = tab === 'closed'
      ? 'ORDER BY j.updated_at DESC'
      : 'ORDER BY j.is_priority DESC, j.is_verified DESC, j.posted_date DESC';

    const sql = `
      SELECT
        j.*,
        a.id          AS applied_id,
        a.applied_date,
        a.notes       AS applied_notes,
        a.closed_by_employer
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.id
      ${whereClause}
    `;

    const [rows]    = await db.query(sql,      [...params, limit, offset]);
    const [countRow]= await db.query(countSql, params);
    const total     = countRow[0]?.total || 0;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Jobs] GET /api/jobs error:', err);
    console.error('[Jobs] Error details:', err.message);
    console.error('[Jobs] Error stack:', err.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.', error: err.message });
  }
});

// ─── GET /api/jobs/stats ───────────────────────────────────────────────────────
// Returns counts for each tab + category breakdown
router.get('/stats', async (req, res) => {
  try {
    const [[{ total_active }]]   = await db.query('SELECT COUNT(*) AS total_active FROM jobs WHERE is_active = 1');
    const [[{ total_priority }]] = await db.query('SELECT COUNT(*) AS total_priority FROM jobs WHERE is_active = 1 AND is_priority = 1');
    const [[{ total_closed }]]   = await db.query('SELECT COUNT(*) AS total_closed FROM jobs WHERE is_active = 0');
    const [[{ total_applied }]]  = await db.query('SELECT COUNT(*) AS total_applied FROM applications');

    const [catRows] = await db.query(
      'SELECT role_category, COUNT(*) AS count FROM jobs WHERE is_active = 1 GROUP BY role_category ORDER BY count DESC'
    );

    const [srcRows] = await db.query(
      'SELECT source, COUNT(*) AS count FROM jobs WHERE is_active = 1 GROUP BY source ORDER BY count DESC'
    );

    res.json({
      success: true,
      stats: {
        total_active,
        total_priority,
        total_closed,
        total_applied,
        by_category: catRows,
        by_source: srcRows,
      },
    });
  } catch (err) {
    console.error('[Jobs] GET /api/jobs/stats error:', err);
    console.error('[Jobs] Stats error details:', err.message);
    console.error('[Jobs] Stats error stack:', err.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.', error: err.message });
  }
});

// ─── POST /api/jobs/:id/apply ──────────────────────────────────────────────────
// Mark a job as applied
router.post('/:id/apply', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const notes = req.body.notes || null;

    // Verify job exists
    const [[job]] = await db.query('SELECT id FROM jobs WHERE id = ?', [jobId]);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    await db.query(
      `INSERT INTO applications (job_id, notes)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE notes = VALUES(notes), applied_date = applied_date`,
      [jobId, notes]
    );

    res.json({ success: true, message: 'Marked as applied.' });
  } catch (err) {
    console.error('[Jobs] POST apply error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark as applied.' });
  }
});

// ─── DELETE /api/jobs/:id/apply ────────────────────────────────────────────────
// Un-apply a job
router.delete('/:id/apply', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    await db.query('DELETE FROM applications WHERE job_id = ?', [jobId]);
    res.json({ success: true, message: 'Application removed.' });
  } catch (err) {
    console.error('[Jobs] DELETE apply error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove application.' });
  }
});

// ─── POST /api/jobs/refresh ────────────────────────────────────────────────────
// Manually trigger the ingestion pipeline
router.post('/refresh', async (req, res) => {
  try {
    console.log('[Jobs] Manual pipeline refresh triggered by user');
    // Run async — respond immediately so UI doesn't hang
    res.json({ success: true, message: 'Ingestion pipeline started. Check ingestion log for progress.' });
    runPipeline().catch(err => console.error('[Jobs] Manual refresh error:', err));
  } catch (err) {
    console.error('[Jobs] POST /refresh error:', err);
    res.status(500).json({ success: false, message: 'Failed to trigger refresh.' });
  }
});

module.exports = router;
