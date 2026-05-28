import cron from 'node-cron';
import { runOverdueChecker } from './overdueChecker.js';
import { runDeadlineSoonReminder } from './deadlineSoonReminder.js';

export function startCronJobs() {
  cron.schedule('*/5 * * * *', () => {
    runOverdueChecker().catch((err) => console.error('overdueChecker', err));
  });
  cron.schedule('*/15 * * * *', () => {
    runDeadlineSoonReminder().catch((err) => console.error('deadlineSoonReminder', err));
  });
  console.log('🕒 Cron jobs scheduled');
}
