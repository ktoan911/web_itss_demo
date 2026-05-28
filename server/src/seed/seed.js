import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { PomodoroSession } from '../models/PomodoroSession.js';
import { UserSetting } from '../models/UserSetting.js';
import { Notification } from '../models/Notification.js';
import { hashPassword } from '../utils/passwordHasher.js';
import { rankOf } from '../utils/priorityRank.js';

const RESET = process.argv.includes('--reset');

const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);

async function run() {
  await connectDB();
  if (RESET) {
    await Promise.all([
      User.deleteMany({}), Task.deleteMany({}),
      PomodoroSession.deleteMany({}), UserSetting.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🧹 Cleared collections');
  } else {
    const count = await User.countDocuments();
    if (count > 0) {
      console.log('Already seeded. Use --reset to wipe and re-seed.');
      await disconnectDB();
      return;
    }
  }

  const passwordHash = await hashPassword('123456');
  const user = await User.create({
    fullName: 'Demo User',
    email: 'demo@taskflow.com',
    passwordHash,
  });
  await UserSetting.create({ userId: user._id });

  const taskSeeds = [
    { title: 'Finish Q2 report',  deadline: daysFromNow(0),   priority: 'High',   status: 'Todo',         estimatedPomodoros: 4, completedPomodoros: 1 },
    { title: 'Review chapter 5',  deadline: daysFromNow(0),   priority: 'Medium', status: 'InProgress',   estimatedPomodoros: 3, completedPomodoros: 2 },
    { title: 'Prepare presentation', deadline: daysFromNow(2),priority: 'High',   status: 'Todo',         estimatedPomodoros: 6, completedPomodoros: 0 },
    { title: 'Practice coding',   deadline: daysFromNow(3),   priority: 'Low',    status: 'Todo',         estimatedPomodoros: 2, completedPomodoros: 0 },
    { title: 'Buy groceries',     deadline: daysFromNow(-1),  priority: 'Low',    status: 'Todo',         estimatedPomodoros: 1, completedPomodoros: 0 },
    { title: 'Send invoice',      deadline: daysFromNow(-3),  priority: 'Medium', status: 'Completed',    estimatedPomodoros: 1, completedPomodoros: 1, completedAt: daysFromNow(-3) },
    { title: 'Read book chapter', deadline: daysFromNow(-5),  priority: 'Low',    status: 'Completed',    estimatedPomodoros: 2, completedPomodoros: 2, completedAt: daysFromNow(-4) },
    { title: 'Refactor module',   deadline: daysFromNow(-10), priority: 'High',   status: 'Completed',    estimatedPomodoros: 5, completedPomodoros: 5, completedAt: daysFromNow(-8) },
  ];
  const tasks = await Task.insertMany(
    taskSeeds.map((t) => ({ ...t, userId: user._id, priorityRank: rankOf(t.priority) })),
  );

  const sessions = [];
  for (let i = 0; i < 14; i++) {
    const day = daysFromNow(-i);
    const count = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < count; j++) {
      const startedAt = new Date(day.getTime() + (9 + j) * 3_600_000);
      const endedAt = new Date(startedAt.getTime() + 25 * 60_000);
      sessions.push({
        userId: user._id,
        taskId: tasks[Math.floor(Math.random() * tasks.length)]._id,
        mode: 'Focus',
        durationMinutes: 25,
        startedAt, endedAt, isCompleted: true,
      });
    }
  }
  await PomodoroSession.insertMany(sessions);

  await Notification.insertMany([
    { userId: user._id, type: 'task_overdue',   taskId: tasks[4]._id,
      title: 'Task overdue', message: '"Buy groceries" passed its deadline.', isRead: false },
    { userId: user._id, type: 'task_completed', taskId: tasks[5]._id,
      title: 'Task completed', message: '"Send invoice" marked as completed.', isRead: true },
    { userId: user._id, type: 'pomodoro_done',  taskId: tasks[1]._id,
      title: 'Focus session complete', message: 'Great job! 25 min focus done.', isRead: false },
  ]);

  console.log(`✅ Seeded user demo@taskflow.com / 123456 with ${tasks.length} tasks, ${sessions.length} sessions, 3 notifications.`);
  await disconnectDB();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
