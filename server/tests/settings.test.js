import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();

describe('GET /api/settings', () => {
  it('returns defaults for new user', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
      theme: 'light', notificationEnabled: true,
    });
  });

  it('rejects unauthenticated', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/settings', () => {
  it('updates declared fields, ignores unknown', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings').send({ focusDuration: 50, theme: 'dark', foo: 'bar' });
    expect(res.status).toBe(200);
    expect(res.body.focusDuration).toBe(50);
    expect(res.body.theme).toBe('dark');
    expect(res.body.foo).toBeUndefined();
  });

  it('rejects out-of-range duration', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings').send({ focusDuration: 999 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/settings/profile', () => {
  it('updates fullName', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings/profile').send({ fullName: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('New Name');
  });
});

describe('PUT /api/settings/password', () => {
  it('changes password when current is correct', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings/password').send({
      currentPassword: '123456', newPassword: 'newpass1', confirmPassword: 'newpass1',
    });
    expect(res.status).toBe(200);
  });

  it('rejects wrong current password', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings/password').send({
      currentPassword: 'wrong1', newPassword: 'newpass1', confirmPassword: 'newpass1',
    });
    expect(res.status).toBe(401);
  });
});
