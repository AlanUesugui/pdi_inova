import cron from 'node-cron';
import { runWeeklyReportForAllManagers } from './weeklyReport';

/**
 * Schedules the weekly report cron job.
 *
 * Default schedule: every Monday at 07:00 AM (server local time).
 * Cron expression: '0 7 * * 1'
 *   - 0   → minute 0
 *   - 7   → hour 7
 *   - *   → any day of month
 *   - *   → any month
 *   - 1   → Monday (0=Sunday, 1=Monday, … 6=Saturday)
 *
 * You can override the schedule via the WEEKLY_REPORT_CRON env variable.
 * Examples:
 *   WEEKLY_REPORT_CRON="0 8 * * 1"   → Monday at 08:00
 *   WEEKLY_REPORT_CRON="0 7 * * 1,5" → Monday and Friday at 07:00
 */
export function startScheduler(): void {
  const cronExpression = process.env.WEEKLY_REPORT_CRON || '0 7 * * 1';

  if (!cron.validate(cronExpression)) {
    console.error(
      `[Scheduler] Invalid cron expression: "${cronExpression}". ` +
        'Weekly report will NOT be scheduled. Check WEEKLY_REPORT_CRON env variable.'
    );
    return;
  }

  console.log(
    `[Scheduler] Weekly report scheduled with cron: "${cronExpression}" (every Monday 07:00 by default)`
  );

  cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Firing weekly report job at ${new Date().toISOString()}`);
    try {
      await runWeeklyReportForAllManagers();
    } catch (err) {
      console.error('[Scheduler] Unhandled error during weekly report job:', err);
    }
  });
}
