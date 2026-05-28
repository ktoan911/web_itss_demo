import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();

describe('GET /api/statistics/*', () => {
  it('tasks series has 7 days for 7days range', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/statistics/tasks?range=7days');
    expect(r.body).toHaveLength(7);
    for (const d of r.body) expect(d).toHaveProperty('date');
  });

  it('pomodoros returns daily + byPriority + byStatus', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/statistics/pomodoros?range=30days');
    expect(r.body.daily).toHaveLength(30);
    expect(Array.isArray(r.body.byPriority)).toBe(true);
    expect(Array.isArray(r.body.byStatus)).toBe(true);
  });

  it('defaults to 7days when range missing', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/statistics/tasks');
    expect(r.body).toHaveLength(7);
  });
});
