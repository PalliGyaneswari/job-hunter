/**
 * Ingestion Pipeline Orchestrator
 * Coordinates all source fetchers → normalize → deduplicate → filter → upsert DB
 *
 * Usage:
 *   const { runPipeline } = require('./pipeline');
 *   await runPipeline();
 */

require('dotenv').config();
const db = require('../config/db');
const { fetchAdzuna }    = require('./sources/adzuna');
const { fetchJSearch }   = require('./sources/jsearch');
const { fetchJooble }    = require('./sources/jooble');
const { fetchArbeitnow } = require('./sources/arbeitnow');
const { fetchRemoteOK }  = require('./sources/remoteok');
const { deduplicate }    = require('./deduplicator');
const { applyFilters }   = require('./filters');

/**
 * Upsert a single normalized+filtered job into the DB.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE to avoid clobbering applied status.
 * Returns 'new' | 'updated' | 'skipped'
 */
async function upsertJob(job) {
  const sql = `
    INSERT INTO jobs
      (job_id, title, company, location, role_category, source, url,
       posted_date, description_snippet, is_active, is_priority, is_verified, is_stale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title               = VALUES(title),
      company             = VALUES(company),
      location            = VALUES(location),
      role_category       = VALUES(role_category),
      url                 = VALUES(url),
      posted_date         = VALUES(posted_date),
      description_snippet = VALUES(description_snippet),
      is_active           = VALUES(is_active),
      is_priority         = VALUES(is_priority),
      is_verified         = VALUES(is_verified),
      is_stale            = VALUES(is_stale),
      updated_at          = CURRENT_TIMESTAMP
  `;

  const params = [
    job.job_id, job.title, job.company, job.location,
    job.role_category, job.source, job.url,
    job.posted_date, job.description_snippet,
    job.is_active ?? 1,
    job.is_priority ?? 0,
    job.is_verified ?? 0,
    job.is_stale ?? 0,
  ];

  const [result] = await db.execute(sql, params);
  if (result.affectedRows === 1 && result.insertId > 0) return 'new';
  if (result.affectedRows === 2) return 'updated';
  return 'skipped';
}

/**
 * Log a pipeline run to ingestion_log table.
 */
async function logRun({ source, jobsFetched, jobsNew, jobsUpdated, jobsFiltered, errorMessage, durationMs }) {
  await db.execute(
    `INSERT INTO ingestion_log
      (source, jobs_fetched, jobs_new, jobs_updated, jobs_filtered, error_message, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [source, jobsFetched, jobsNew, jobsUpdated, jobsFiltered, errorMessage || null, durationMs]
  );
}

/**
 * Run a single source through the pipeline.
 */
async function runSource(name, fetchFn) {
  const start = Date.now();
  let jobsFetched = 0, jobsNew = 0, jobsUpdated = 0, jobsFiltered = 0, errorMessage = null;

  try {
    console.log(`\n[Pipeline] ── Running source: ${name} ──`);
    const raw = await fetchFn();
    jobsFetched = raw.length;

    // Deduplicate within this batch
    const unique = deduplicate(raw);
    console.log(`[Pipeline] ${name}: ${raw.length} fetched → ${unique.length} after dedup`);

    // Apply filters
    const filtered = [];
    for (const job of unique) {
      const { pass, job: enriched } = applyFilters(job);
      if (pass) {
        filtered.push(enriched);
      } else {
        jobsFiltered++;
      }
    }
    console.log(`[Pipeline] ${name}: ${filtered.length} passed filters (${jobsFiltered} excluded)`);

    // Upsert to DB
    for (const job of filtered) {
      try {
        const status = await upsertJob(job);
        if (status === 'new') jobsNew++;
        else if (status === 'updated') jobsUpdated++;
      } catch (dbErr) {
        console.error(`[Pipeline] DB upsert error for job "${job.title}" (${name}):`, dbErr.message);
      }
    }

    console.log(`[Pipeline] ${name}: +${jobsNew} new, ~${jobsUpdated} updated`);
  } catch (err) {
    errorMessage = err.message;
    console.error(`[Pipeline] Source "${name}" failed:`, err.message);
  }

  const durationMs = Date.now() - start;
  await logRun({ source: name, jobsFetched, jobsNew, jobsUpdated, jobsFiltered, errorMessage, durationMs }).catch(() => {});

  return { source: name, jobsFetched, jobsNew, jobsUpdated, jobsFiltered, durationMs, error: errorMessage };
}

/**
 * Main pipeline — runs all sources sequentially.
 * @param {Object} options
 * @param {boolean} options.dryRun - If true, fetch+filter but don't write to DB
 * @returns {Promise<Object[]>} - Array of per-source results
 */
async function runPipeline({ dryRun = false } = {}) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`[Pipeline] JobPulse Ingestion Run — ${new Date().toISOString()}`);
  if (dryRun) console.log('[Pipeline] DRY RUN mode — no DB writes');
  console.log(`${'═'.repeat(60)}\n`);

  const SOURCES = [
    { name: 'adzuna',    fn: fetchAdzuna    },
    { name: 'jsearch',   fn: fetchJSearch   },
    { name: 'jooble',    fn: fetchJooble    },
    { name: 'arbeitnow', fn: fetchArbeitnow },
    { name: 'remoteok',  fn: fetchRemoteOK  },
  ];

  const results = [];
  for (const { name, fn } of SOURCES) {
    const result = await runSource(name, fn);
    results.push(result);
  }

  // Summary
  const totals = results.reduce((acc, r) => ({
    fetched:  acc.fetched  + r.jobsFetched,
    new:      acc.new      + r.jobsNew,
    updated:  acc.updated  + r.jobsUpdated,
    filtered: acc.filtered + r.jobsFiltered,
  }), { fetched: 0, new: 0, updated: 0, filtered: 0 });

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[Pipeline] SUMMARY: ${totals.fetched} fetched | ${totals.new} new | ${totals.updated} updated | ${totals.filtered} excluded`);
  console.log(`${'─'.repeat(60)}\n`);

  return results;
}

// Allow running as standalone: node src/ingestion/pipeline.js [--dry-run]
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  const dryRun = process.argv.includes('--dry-run');
  runPipeline({ dryRun })
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { runPipeline };
