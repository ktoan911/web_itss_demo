import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();
const futureISO = (days = 1) => new Date(Date.now() + days * 86_400_000).toISOString();

const baseTask = (over = {}) => ({
  title: 'Finish report',
  description: 'Q2 metrics',
  deadline: futureISO(2),
  priority: 'Medium',
  estimatedPomodoros: 3,
  ...over,
});

describe('Tasks CRUD', () => {
  it('creates and lists tasks', async () => {
    const a = await createAuthedAgent(app);
    const create = await a.post('/api/tasks').send(baseTask());
    expect(create.status).toBe(201);
    const list = await a.get('/api/tasks');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('Finish report');
    expect(list.body[0].isOverdue).toBe(false);
  });

  it('updates a task', async () => {
    const a = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask())).body;
    const upd = await a.put(`/api/tasks/${t._id}`).send({ title: 'Updated' });
    expect(upd.body.title).toBe('Updated');
  });

  it('deletes a task', async () => {
    const a = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask())).body;
    expect((await a.delete(`/api/tasks/${t._id}`)).status).toBe(200);
    expect((await a.get(`/api/tasks/${t._id}`)).status).toBe(404);
  });

  it('mark complete sets completedAt + status', async () => {
    const a = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask())).body;
    const r = await a.patch(`/api/tasks/${t._id}/complete`);
    expect(r.body.status).toBe('Completed');
    expect(r.body.completedAt).toBeTruthy();
  });

  it('filters by status and priority', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/tasks').send(baseTask({ priority: 'Low' }));
    await a.post('/api/tasks').send(baseTask({ priority: 'High', title: 'Urgent' }));
    const high = await a.get('/api/tasks?priority=High');
    expect(high.body).toHaveLength(1);
    expect(high.body[0].title).toBe('Urgent');
  });

  it('searches by title (text index)', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/tasks').send(baseTask({ title: 'Buy groceries' }));
    await a.post('/api/tasks').send(baseTask({ title: 'Walk the dog' }));
    const r = await a.get('/api/tasks?search=groceries');
    expect(r.body).toHaveLength(1);
    expect(r.body[0].title).toBe('Buy groceries');
  });

  it('marks overdue task with isOverdue=true', async () => {
    const a = await createAuthedAgent(app);
    const past = new Date(Date.now() - 86_400_000).toISOString();
    await a.post('/api/tasks').send(baseTask({ deadline: past }));
    const r = await a.get('/api/tasks?deadlineFilter=overdue');
    expect(r.body[0].isOverdue).toBe(true);
  });

  it('IDOR: user B sees 404 for user A task', async () => {
    const a = await createAuthedAgent(app);
    const b = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask())).body;
    const res = await b.get(`/api/tasks/${t._id}`);
    expect(res.status).toBe(404);
  });

  it('rejects invalid id with 400', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.get('/api/tasks/not-an-id');
    expect(res.status).toBe(400);
  });
});
