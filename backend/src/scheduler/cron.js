/**
 * node-cron Scheduler
 * Runs the ingestion pipeline on the configured schedule.
 * Default: daily at 2 AM (0 2 * * *)
 *
 * Also syncs closed-by-employer flag for applied jobs that went inactive.
 */

const cron = require('node-cron');
const db   = require('../config/db');
const { runPipeline } = require('../ingestion/pipeline');

function startScheduler() {
  const schedule = process.env.CRON_SCHEDULE || '0 2 * * *';

  if (!cron.validate(schedule)) {
    console.error(`[Scheduler] Invalid CRON_SCHEDULE: "${schedule}" — using default "0 2 * * *"`);
  }

  const validSchedule = cron.validate(schedule) ? schedule : '0 2 * * *';

  console.log(`[Scheduler] Cron started — schedule: "${validSchedule}"`);

  cron.schedule(validSchedule, async () => {
    console.log(`\n[Scheduler] ⏰ Cron triggered at ${new Date().toISOString()}`);

    try {
      // 1. Run full ingestion pipeline
      await runPipeline();

      // 2. Sync closed_by_employer: if a job in applications is now inactive, flag it
      await db.query(`
        UPDATE applications a
        JOIN jobs j ON j.id = a.job_id
        SET a.closed_by_employer = 1
        WHERE j.is_active = 0
          AND a.closed_by_employer = 0
      `);

      console.log('[Scheduler] ✓ Cron run completed');
    } catch (err) {
      console.error('[Scheduler] Cron run failed:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });
}

module.exports = { startScheduler };
