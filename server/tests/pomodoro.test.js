import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();
const futureISO = (d=1) => new Date(Date.now() + d*86_400_000).toISOString();

const baseTask = (over={}) => ({
  title: 'Study', deadline: futureISO(2), priority: 'Medium', estimatedPomodoros: 2, ...over,
});

describe('Pomodoro sessions', () => {
  it('creates a Focus session and increments task pomodoros', async () => {
    const a = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask())).body;
    const startedAt = new Date(Date.now() - 25*60_000).toISOString();
    const endedAt = new Date().toISOString();
    const r = await a.post('/api/pomodoro-sessions').send({
      taskId: t._id, mode: 'Focus', durationMinutes: 25, startedAt, endedAt, isCompleted: true,
    });
    expect(r.status).toBe(201);
    const updated = await a.get(`/api/tasks/${t._id}`);
    expect(updated.body.completedPomodoros).toBe(1);
    expect(updated.body.status).toBe('InProgress');
  });

  it('rejects taskId belonging to another user with 403', async () => {
    const a = await createAuthedAgent(app);
    const b = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask())).body;
    const r = await b.post('/api/pomodoro-sessions').send({
      taskId: t._id, mode: 'Focus', durationMinutes: 25,
      startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), isCompleted: true,
    });
    expect(r.status).toBe(403);
  });

  it('estimated_reached fires once when reaching estimate', async () => {
    const a = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask({ estimatedPomodoros: 1 }))).body;
    await a.post('/api/pomodoro-sessions').send({
      taskId: t._id, mode: 'Focus', durationMinutes: 25,
      startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), isCompleted: true,
    });
    // second focus should NOT create another estimated_reached
    await a.post('/api/pomodoro-sessions').send({
      taskId: t._id, mode: 'Focus', durationMinutes: 25,
      startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), isCompleted: true,
    });
    const list = await a.get('/api/notifications');
    const reached = list.body.filter((n) => n.type === 'estimated_reached');
    expect(reached).toHaveLength(1);
  });

  it('returns recent sessions', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/pomodoro-sessions').send({
      mode: 'Focus', durationMinutes: 25,
      startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), isCompleted: true,
    });
    const r = await a.get('/api/pomodoro-sessions/recent');
    expect(r.body).toHaveLength(1);
  });
});
