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
});
