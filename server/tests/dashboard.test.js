import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();
const futureISO = (d=1) => new Date(Date.now() + d*86_400_000).toISOString();
const pastISO   = (d=1) => new Date(Date.now() - d*86_400_000).toISOString();

describe('GET /api/dashboard/summary', () => {
  it('aggregates counts correctly', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/tasks').send({ title: 't1', deadline: futureISO(1), priority: 'Low', estimatedPomodoros: 1 });
    const t2 = await a.post('/api/tasks').send({ title: 't2', deadline: futureISO(1), priority: 'Medium', estimatedPomodoros: 1 });
    await a.patch(`/api/tasks/${t2.body._id}/complete`);
    await a.post('/api/tasks').send({ title: 'overdue', deadline: pastISO(1), priority: 'High', estimatedPomodoros: 1 });

    const r = await a.get('/api/dashboard/summary');
    expect(r.body.totalTasks).toBe(3);
    expect(r.body.completedTasks).toBe(1);
    expect(r.body.overdueTasks).toBe(1);
    expect(r.body.completionChart).toHaveLength(7);
  });

  it('includes dueSoon data honoring the reminder window', async () => {
    const a = await createAuthedAgent(app);
    // Use a NON-default window (48h) so the assertion fails if the DB
    // setting is never read (the fallback default is 24h).
    await a.put('/api/settings').send({ deadlineReminderHours: 48 });
    // 2h out → due soon; ~30h out → inside 48h but outside the 24h default;
    // 5 days out → not due soon.
    const in2h = new Date(Date.now() + 2 * 3_600_000).toISOString();
    const in30h = new Date(Date.now() + 30 * 3_600_000).toISOString();
    await a.post('/api/tasks').send({ title: 'soon', deadline: in2h, priority: 'High', estimatedPomodoros: 1 });
    await a.post('/api/tasks').send({ title: 'in30h', deadline: in30h, priority: 'Medium', estimatedPomodoros: 1 });
    await a.post('/api/tasks').send({ title: 'later', deadline: futureISO(5), priority: 'Low', estimatedPomodoros: 1 });

    const r = await a.get('/api/dashboard/summary');
    expect(r.body.dueSoonHours).toBe(48);
    expect(r.body.dueSoonTasks.map((t) => t.title)).toContain('soon');
    expect(r.body.dueSoonTasks.map((t) => t.title)).toContain('in30h');
    expect(r.body.dueSoonTasks.map((t) => t.title)).not.toContain('later');
  });
});
