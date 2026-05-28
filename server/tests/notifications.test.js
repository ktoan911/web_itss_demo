import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';
import { notificationService } from '../src/services/notification.service.js';

const app = buildApp();

describe('Notifications', () => {
  it('lists empty initially', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/notifications');
    expect(r.body).toEqual([]);
  });

  it('marks single as read', async () => {
    const a = await createAuthedAgent(app);
    const n = await notificationService.create(a.userId, {
      title: 't', message: 'm', type: 'task_completed',
    });
    const r = await a.patch(`/api/notifications/${n._id}/read`);
    expect(r.body.isRead).toBe(true);
  });

  it('mark all read', async () => {
    const a = await createAuthedAgent(app);
    await notificationService.create(a.userId, { title: 'a', message: 'a', type: 'task_completed' });
    await notificationService.create(a.userId, { title: 'b', message: 'b', type: 'pomodoro_done' });
    const r = await a.patch('/api/notifications/read-all');
    expect(r.body.count).toBe(2);
  });

  it('createDeduped suppresses within window', async () => {
    const a = await createAuthedAgent(app);
    const taskId = '507f1f77bcf86cd799439011';
    const first = await notificationService.createDeduped(a.userId, {
      title: 't', message: 'm', type: 'task_overdue', taskId, withinMs: 86_400_000,
    });
    const second = await notificationService.createDeduped(a.userId, {
      title: 't', message: 'm', type: 'task_overdue', taskId, withinMs: 86_400_000,
    });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('respects notificationEnabled=false', async () => {
    const a = await createAuthedAgent(app);
    await a.put('/api/settings').send({ notificationEnabled: false });
    const n = await notificationService.create(a.userId, {
      title: 't', message: 'm', type: 'task_completed',
    });
    expect(n).toBeNull();
  });
});
