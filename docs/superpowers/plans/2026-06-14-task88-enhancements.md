# Task88 Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Calendar month navigation bug and add four user-facing features — configurable deadline reminders (default 24h), a dashboard deadline banner, a Duolingo-style daily Pomodoro streak, and contextual help (small `(i)` tooltips + driver.js guided tours).

**Architecture:** Backend is Express + Mongoose (MongoDB), frontend is React 19 + Vite + Zustand + React Query + Tailwind. Deadline reminders already exist as cron jobs (`server/src/jobs/deadlineSoonReminder.js`, `overdueChecker.js`); we make the "soon" threshold a per-user setting and surface a banner on the dashboard. The streak is a per-user counter on the `User` model, bumped server-side whenever a Focus session completes, and exposed through the existing dashboard summary so React Query's existing invalidation refreshes it. Help is a self-contained `driver.js` tour registry keyed by route plus a reusable `InfoTooltip` component.

**Tech Stack:** Express, Mongoose, Zod, Jest + supertest + mongodb-memory-server (server); React, react-big-calendar, react-query, zustand, lucide-react, Vitest (client); new dependency `driver.js`.

---

## File Structure

**Feature 1 — Calendar navigation (bug fix)**
- Modify: `client/src/pages/CalendarPage.tsx` — add `date` state.
- Modify: `client/src/components/calendar/CalendarView.tsx` — accept + forward `date`/`onNavigate`.

**Feature 2 — Configurable deadline reminder threshold**
- Modify: `server/src/models/UserSetting.js` — add `deadlineReminderHours`.
- Modify: `server/src/validators/settings.validator.js` — validate the field.
- Modify: `server/src/jobs/deadlineSoonReminder.js` — per-user threshold instead of fixed 1h.
- Test: `server/tests/notifications.test.js` — threshold behaviour.
- Modify: `client/src/types/settings.ts` — type the field.
- Modify: `client/src/validators/settings.schema.ts` — `remindersSchema`.
- Modify: `client/src/pages/SettingsPage.tsx` — "Deadline reminders" card.

**Feature 3 — Dashboard deadline banner**
- Modify: `server/src/services/dashboard.service.js` — add `dueSoonTasks` + `dueSoonHours`.
- Test: `server/tests/dashboard.test.js` — banner data.
- Create: `client/src/components/dashboard/DeadlineBanner.tsx`.
- Modify: `client/src/types/dashboard.ts` (create if missing) — summary type.
- Modify: `client/src/pages/DashboardPage.tsx` — render banner.

**Feature 4 — Daily Pomodoro streak**
- Modify: `server/src/models/User.js` — `pomodoroStreak` sub-doc.
- Create: `server/src/services/streak.service.js` — pure streak math + persistence.
- Test: `server/tests/streak.test.js` — streak transitions.
- Modify: `server/src/services/pomodoro.service.js` — bump streak on Focus complete.
- Modify: `server/src/services/dashboard.service.js` — return `streak`.
- Modify: `client/src/types/dashboard.ts` — `streak`.
- Create: `client/src/components/dashboard/StreakCard.tsx`.
- Modify: `client/src/pages/DashboardPage.tsx` — render streak card.
- Modify: `client/src/pages/PomodoroPage.tsx` — small flame badge.

**Feature 5 — Contextual help (tooltips + tours)**
- Add dependency: `driver.js` in `client/package.json`.
- Create: `client/src/components/common/InfoTooltip.tsx`.
- Test: `client/src/components/common/__tests__/InfoTooltip.test.tsx`.
- Create: `client/src/lib/guides.ts` — tour step registry keyed by route.
- Create: `client/src/components/common/HelpButton.tsx` — runs the tour for current route.
- Modify: `client/src/components/layout/Header.tsx` — mount `HelpButton`.
- Modify: a few section headers (Dashboard, Settings) to attach `InfoTooltip` + tour anchors.

---

## Feature 1 — Calendar month navigation (bug fix)

**Root cause:** `react-big-calendar` is used in controlled mode (`view`/`onView` passed) but `date`/`onNavigate` are never passed. Without `onNavigate`, the Back/Next/Today toolbar buttons have nowhere to push the new date, so the visible month never changes.

### Task 1.1: Forward `date`/`onNavigate` through CalendarView

**Files:**
- Modify: `client/src/components/calendar/CalendarView.tsx`
- Modify: `client/src/pages/CalendarPage.tsx`

- [ ] **Step 1: Add `date`/`onNavigate` to CalendarView props and the `<Calendar>` element**

Replace the whole `Props` type and `<Calendar ...>` usage in `client/src/components/calendar/CalendarView.tsx`:

```tsx
type Props = {
  tasks: Task[];
  date: Date;
  onNavigate: (d: Date) => void;
  selectedDate: Date | null;
  view: View; onViewChange: (v: View) => void;
  onSelectDay: (d: Date) => void;
  onSelectTask: (t: Task) => void;
};

export function CalendarView({
  tasks, date, onNavigate, selectedDate, view, onViewChange, onSelectDay, onSelectTask,
}: Props) {
  const events: Event[] = tasks.map((t) => {
    const start = new Date(t.deadline);
    return { id: t._id, title: t.title, start, end: start, resource: t };
  });

  return (
    <Calendar
      localizer={localizer}
      events={events}
      views={['month', 'week']}
      view={view}
      onView={onViewChange}
      date={date}
      onNavigate={onNavigate}
      style={{ height: 600 }}
      selectable
      onSelectSlot={(s) => onSelectDay(s.start)}
      onSelectEvent={(e) => onSelectTask((e as Event).resource)}
      dayPropGetter={(d) =>
        selectedDate && isSameDay(d, selectedDate)
          ? { style: { background: 'rgba(99,102,241,0.12)' } } : {}
      }
      eventPropGetter={(e) => ({
        style: { backgroundColor: colorByPriority((e as Event).resource.priority), color: 'white' },
      })}
    />
  );
}
```

- [ ] **Step 2: Add `date` state in CalendarPage and pass it down**

In `client/src/pages/CalendarPage.tsx`, add the state next to the existing `view` state and pass the two new props. Add after the `view` line:

```tsx
  const [date, setDate] = useState<Date>(new Date());
```

And update the `<CalendarView ... />` usage to include:

```tsx
          <CalendarView
            tasks={tasks.data ?? []}
            date={date}
            onNavigate={setDate}
            selectedDate={selectedDate}
            view={view}
            onViewChange={setView}
            onSelectDay={setSelectedDate}
            onSelectTask={setEditing}
          />
```

- [ ] **Step 3: Build the client to verify types**

Run: `cd client && npm run build`
Expected: PASS (tsc + vite build, no type errors about missing `date`/`onNavigate`).

- [ ] **Step 4: Manual verification (record result)**

Run: `cd client && npm run dev`, open `/calendar`, click Back/Next/Today.
Expected: visible month changes; selecting a day still highlights it and the day panel updates. State what you observed.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/calendar/CalendarView.tsx client/src/pages/CalendarPage.tsx
git commit -m "fix(calendar): wire date/onNavigate so Back/Next change months"
```

---

## Feature 2 — Configurable deadline reminder threshold (default 24h)

### Task 2.1: Add `deadlineReminderHours` to the UserSetting model + validator

**Files:**
- Modify: `server/src/models/UserSetting.js`
- Modify: `server/src/validators/settings.validator.js`

- [ ] **Step 1: Add the field to the schema**

In `server/src/models/UserSetting.js`, add this field inside the schema object (after `notifySoundEnabled`):

```js
    deadlineReminderHours: { type: Number, default: 24, min: 1, max: 168 },
```

- [ ] **Step 2: Add the field to the server validator**

In `server/src/validators/settings.validator.js`, add to `settingsUpdateSchema`:

```js
  deadlineReminderHours: z.number().int().min(1).max(168).optional(),
```

- [ ] **Step 3: Write a failing test for the default + update**

Add to `server/tests/settings.test.js` inside the `describe('GET /api/settings', ...)` block:

```js
  it('returns default deadlineReminderHours of 24', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.get('/api/settings');
    expect(res.body.deadlineReminderHours).toBe(24);
  });
```

And inside `describe('PUT /api/settings', ...)`:

```js
  it('updates deadlineReminderHours within range', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings').send({ deadlineReminderHours: 48 });
    expect(res.status).toBe(200);
    expect(res.body.deadlineReminderHours).toBe(48);
  });

  it('rejects out-of-range deadlineReminderHours', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings').send({ deadlineReminderHours: 500 });
    expect(res.status).toBe(400);
  });
```

- [ ] **Step 4: Run the tests**

Run: `cd server && npx jest tests/settings.test.js`
Expected: PASS (all three new cases green).

- [ ] **Step 5: Commit**

```bash
git add server/src/models/UserSetting.js server/src/validators/settings.validator.js server/tests/settings.test.js
git commit -m "feat(settings): add configurable deadlineReminderHours (default 24)"
```

### Task 2.2: Make the deadline-soon job honor each user's threshold

**Files:**
- Modify: `server/src/jobs/deadlineSoonReminder.js`
- Test: `server/tests/notifications.test.js`

- [ ] **Step 1: Write a failing test for a configurable threshold**

Add to `server/tests/notifications.test.js` inside `describe('Cron job logic', ...)`:

```js
  it('deadlineSoonReminder respects a user-configured threshold', async () => {
    const a = await createAuthedAgent(app);
    await a.put('/api/settings').send({ deadlineReminderHours: 48 });
    // 30h out: outside the default 24h window but inside the configured 48h window.
    const in30h = new Date(Date.now() + 30 * 3_600_000).toISOString();
    await a.post('/api/tasks').send({
      title: 'cfg', deadline: in30h, priority: 'High', estimatedPomodoros: 1,
    });
    await runDeadlineSoonReminder();
    const list = await a.get('/api/notifications');
    expect(list.body.some((n) => n.type === 'deadline_soon')).toBe(true);
  });

  it('deadlineSoonReminder skips tasks beyond the threshold', async () => {
    const a = await createAuthedAgent(app);
    // default 24h; task 30h out should NOT fire.
    const in30h = new Date(Date.now() + 30 * 3_600_000).toISOString();
    await a.post('/api/tasks').send({
      title: 'far', deadline: in30h, priority: 'High', estimatedPomodoros: 1,
    });
    await runDeadlineSoonReminder();
    const list = await a.get('/api/notifications');
    expect(list.body.some((n) => n.type === 'deadline_soon')).toBe(false);
  });
```

- [ ] **Step 2: Run to confirm the second case fails**

Run: `cd server && npx jest tests/notifications.test.js -t "respects a user-configured threshold"`
Expected: FAIL — current job uses a fixed 1h window, so the 30h task never fires even with a 48h setting.

- [ ] **Step 3: Rewrite the job to use per-user thresholds**

Replace the entire contents of `server/src/jobs/deadlineSoonReminder.js`:

```js
import { Task } from '../models/Task.js';
import { UserSetting } from '../models/UserSetting.js';
import { notificationService } from '../services/notification.service.js';

const DEFAULT_HOURS = 24;

export async function runDeadlineSoonReminder(now = new Date()) {
  // Pull all not-yet-due, incomplete tasks once, then filter per user threshold.
  const tasks = await Task.find({
    status: { $ne: 'Completed' },
    deadline: { $gt: now },
  }).select('_id userId title deadline');

  const hoursByUser = new Map();
  const thresholdHours = async (userId) => {
    const key = userId.toString();
    if (!hoursByUser.has(key)) {
      const s = await UserSetting.findOne({ userId }).select('deadlineReminderHours');
      hoursByUser.set(key, s?.deadlineReminderHours ?? DEFAULT_HOURS);
    }
    return hoursByUser.get(key);
  };

  let matched = 0;
  for (const task of tasks) {
    const hours = await thresholdHours(task.userId);
    const limit = new Date(now.getTime() + hours * 3_600_000);
    if (task.deadline > limit) continue;
    matched += 1;
    await notificationService.createDeduped(task.userId, {
      title: 'Deadline approaching',
      message: `"${task.title}" is due within ${hours}h.`,
      type: 'deadline_soon',
      taskId: task._id,
      withinMs: hours * 3_600_000,
    });
  }
  return matched;
}
```

- [ ] **Step 4: Run the full notifications test file**

Run: `cd server && npx jest tests/notifications.test.js`
Expected: PASS — including the existing "fires for tasks within next hour" (30min task is inside the default 24h window) and both new cases.

- [ ] **Step 5: Commit**

```bash
git add server/src/jobs/deadlineSoonReminder.js server/tests/notifications.test.js
git commit -m "feat(reminders): deadline-soon job honors per-user deadlineReminderHours"
```

### Task 2.3: Surface the threshold in Settings UI

**Files:**
- Modify: `client/src/types/settings.ts`
- Modify: `client/src/validators/settings.schema.ts`
- Modify: `client/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Type the new field**

In `client/src/types/settings.ts`, add `deadlineReminderHours: number;` to the `Settings` type (after `notifySoundEnabled`) and add `'deadlineReminderHours'` to the `Pick<...>` union in `SettingsUpdateInput`.

- [ ] **Step 2: Add a reminders schema**

Append to `client/src/validators/settings.schema.ts`:

```ts
export const remindersSchema = z.object({
  deadlineReminderHours: z.number().int().min(1).max(168),
});
export type RemindersValues = z.infer<typeof remindersSchema>;
```

- [ ] **Step 3: Add a "Deadline reminders" card to SettingsPage**

In `client/src/pages/SettingsPage.tsx`:

Add to the schema imports from `@/validators/settings.schema`: `remindersSchema, type RemindersValues`.

Add a form alongside the others (after the `preferences` form definition):

```tsx
  const reminders = useForm<RemindersValues>({
    resolver: zodResolver(remindersSchema),
    defaultValues: { deadlineReminderHours: 24 },
  });
```

In the `useEffect` that resets forms from `settings.data`, add inside the `if (settings.data) { ... }` block:

```tsx
      reminders.reset({ deadlineReminderHours: settings.data.deadlineReminderHours });
```

and add `reminders` to that effect's dependency array.

Add this `<Card>` after the Pomodoro durations card:

```tsx
      <Card>
        <h3 className="mb-4 text-sm font-semibold">Deadline reminders</h3>
        <form
          onSubmit={reminders.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => toast.success('Reminder window updated'),
              onError: () => toast.error('Failed'),
            }),
          )}
          className="space-y-3"
        >
          <Input
            label="Remind me this many hours before a deadline"
            type="number"
            min={1}
            max={168}
            {...reminders.register('deadlineReminderHours', { valueAsNumber: true })}
            error={reminders.formState.errors.deadlineReminderHours?.message}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={updateSettings.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Card>
```

- [ ] **Step 4: Build the client**

Run: `cd client && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/types/settings.ts client/src/validators/settings.schema.ts client/src/pages/SettingsPage.tsx
git commit -m "feat(settings): UI to configure deadline reminder window"
```

---

## Feature 3 — Dashboard deadline banner

### Task 3.1: Add `dueSoonTasks` + `dueSoonHours` to the dashboard summary

**Files:**
- Modify: `server/src/services/dashboard.service.js`
- Test: `server/tests/dashboard.test.js`

- [ ] **Step 1: Write a failing test**

Add to `server/tests/dashboard.test.js` inside the existing `describe`:

```js
  it('includes dueSoon data honoring the reminder window', async () => {
    const a = await createAuthedAgent(app);
    await a.put('/api/settings').send({ deadlineReminderHours: 24 });
    // 2h out → due soon; 5 days out → not due soon.
    const in2h = new Date(Date.now() + 2 * 3_600_000).toISOString();
    await a.post('/api/tasks').send({ title: 'soon', deadline: in2h, priority: 'High', estimatedPomodoros: 1 });
    await a.post('/api/tasks').send({ title: 'later', deadline: futureISO(5), priority: 'Low', estimatedPomodoros: 1 });

    const r = await a.get('/api/dashboard/summary');
    expect(r.body.dueSoonHours).toBe(24);
    expect(r.body.dueSoonTasks.map((t) => t.title)).toContain('soon');
    expect(r.body.dueSoonTasks.map((t) => t.title)).not.toContain('later');
  });
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd server && npx jest tests/dashboard.test.js -t "includes dueSoon"`
Expected: FAIL — `dueSoonHours`/`dueSoonTasks` undefined.

- [ ] **Step 3: Compute dueSoon in the service**

In `server/src/services/dashboard.service.js`:

Add the import at the top:

```js
import { UserSetting } from '../models/UserSetting.js';
```

Inside `summary(userId, now = new Date())`, before the `Promise.all`, add:

```js
    const setting = await UserSetting.findOne({ userId }).select('deadlineReminderHours');
    const dueSoonHours = setting?.deadlineReminderHours ?? 24;
    const dueSoonLimit = new Date(now.getTime() + dueSoonHours * 3_600_000);
```

Add a new entry to the destructured array and to the `Promise.all([...])` (append as the last element, keeping order in sync):

```js
      dueSoonTasks,
```

```js
      Task.find({
        userId, status: { $ne: 'Completed' },
        deadline: { $gt: now, $lte: dueSoonLimit },
      }).sort({ deadline: 1 }).limit(10),
```

Add both to the returned object:

```js
      dueSoonTasks,
      dueSoonHours,
```

- [ ] **Step 4: Run the dashboard tests**

Run: `cd server && npx jest tests/dashboard.test.js`
Expected: PASS (existing aggregation test + new dueSoon test).

- [ ] **Step 5: Commit**

```bash
git add server/src/services/dashboard.service.js server/tests/dashboard.test.js
git commit -m "feat(dashboard): expose dueSoonTasks within the reminder window"
```

### Task 3.2: Render the banner on the dashboard

**Files:**
- Create: `client/src/types/dashboard.ts`
- Create: `client/src/components/dashboard/DeadlineBanner.tsx`
- Modify: `client/src/pages/DashboardPage.tsx`
- Modify: `client/src/hooks/queries/useDashboardQuery.ts`

- [ ] **Step 1: Create the dashboard summary type**

Create `client/src/types/dashboard.ts`:

```ts
import type { Task } from '@/types/task';

export type CompletionPoint = { date: string; count: number };

export type DashboardSummary = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todayPomodoros: number;
  todayFocusMinutes: number;
  todayTasks: Task[];
  upcomingTasks: Task[];
  recentSessions: unknown[];
  completionChart: CompletionPoint[];
  dueSoonTasks: Task[];
  dueSoonHours: number;
  streak: number;
};
```

- [ ] **Step 2: Type the dashboard query**

Replace `client/src/hooks/queries/useDashboardQuery.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboardApi';
import type { DashboardSummary } from '@/types/dashboard';

export function useDashboardQuery() {
  return useQuery<DashboardSummary>({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });
}
```

Also update `client/src/api/dashboardApi.ts` to type the response:

```ts
import { api } from './axiosClient';
import type { DashboardSummary } from '@/types/dashboard';

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};
```

- [ ] **Step 3: Create the DeadlineBanner component**

Create `client/src/components/dashboard/DeadlineBanner.tsx`:

```tsx
import { AlertTriangle, Clock } from 'lucide-react';
import type { Task } from '@/types/task';

type Props = {
  overdueCount: number;
  dueSoonTasks: Task[];
  dueSoonHours: number;
  onSelect: (t: Task) => void;
};

export function DeadlineBanner({ overdueCount, dueSoonTasks, dueSoonHours, onSelect }: Props) {
  if (overdueCount === 0 && dueSoonTasks.length === 0) return null;

  return (
    <div className="rounded-3xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" />
        Deadline reminders
      </div>
      <div className="mt-2 space-y-2 text-sm text-amber-900 dark:text-amber-100">
        {overdueCount > 0 && (
          <p>
            You have <strong>{overdueCount}</strong> overdue task
            {overdueCount === 1 ? '' : 's'}.
          </p>
        )}
        {dueSoonTasks.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Due within the next {dueSoonHours}h:
            </p>
            <ul className="space-y-1">
              {dueSoonTasks.map((t) => (
                <li key={t._id}>
                  <button
                    onClick={() => onSelect(t)}
                    className="underline-offset-2 hover:underline"
                  >
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Render the banner in DashboardPage**

In `client/src/pages/DashboardPage.tsx`:

Add the import:

```tsx
import { DeadlineBanner } from '@/components/dashboard/DeadlineBanner';
```

Render it right after the welcome header `</div>` and before the summary-cards grid:

```tsx
      <DeadlineBanner
        overdueCount={d.overdueTasks}
        dueSoonTasks={d.dueSoonTasks}
        dueSoonHours={d.dueSoonHours}
        onSelect={setEditing}
      />
```

- [ ] **Step 5: Build the client**

Run: `cd client && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/types/dashboard.ts client/src/components/dashboard/DeadlineBanner.tsx client/src/pages/DashboardPage.tsx client/src/hooks/queries/useDashboardQuery.ts client/src/api/dashboardApi.ts
git commit -m "feat(dashboard): deadline reminder banner for overdue + due-soon tasks"
```

---

## Feature 4 — Daily Pomodoro streak (Duolingo-style)

**Rule:** Completing a Focus session today bumps the streak. If the last focus day was yesterday → `count + 1`. If it was today already → unchanged. Otherwise (gap or first ever) → reset to `1`. "Day" boundaries use the server clock at UTC start-of-day for determinism in tests.

### Task 4.1: Add the streak field + pure streak math

**Files:**
- Modify: `server/src/models/User.js`
- Create: `server/src/services/streak.service.js`
- Test: `server/tests/streak.test.js`

- [ ] **Step 1: Add the streak sub-document to User**

In `server/src/models/User.js`, add this field inside the schema object (after `passwordHash`):

```js
    pomodoroStreak: {
      count:         { type: Number, default: 0 },
      lastFocusDate: { type: Date, default: null },
    },
```

- [ ] **Step 2: Write failing tests for streak transitions**

Create `server/tests/streak.test.js`:

```js
import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';
import { User } from '../src/models/User.js';
import { streakService, computeNextStreak } from '../src/services/streak.service.js';

buildApp();

const day = (iso) => new Date(iso);

describe('computeNextStreak (pure)', () => {
  it('starts at 1 when there is no prior focus date', () => {
    expect(computeNextStreak({ count: 0, lastFocusDate: null }, day('2026-06-14T10:00:00Z')))
      .toEqual({ count: 1, lastDay: '2026-06-14' });
  });

  it('increments when last focus was the previous day', () => {
    expect(computeNextStreak({ count: 3, lastFocusDate: day('2026-06-13T22:00:00Z') }, day('2026-06-14T01:00:00Z')))
      .toEqual({ count: 4, lastDay: '2026-06-14' });
  });

  it('stays the same when already counted today', () => {
    expect(computeNextStreak({ count: 5, lastFocusDate: day('2026-06-14T08:00:00Z') }, day('2026-06-14T20:00:00Z')))
      .toEqual({ count: 5, lastDay: '2026-06-14' });
  });

  it('resets to 1 after a gap', () => {
    expect(computeNextStreak({ count: 9, lastFocusDate: day('2026-06-10T08:00:00Z') }, day('2026-06-14T08:00:00Z')))
      .toEqual({ count: 1, lastDay: '2026-06-14' });
  });
});

describe('streakService.bump (persistence)', () => {
  it('writes the new streak to the user', async () => {
    const a = await createAuthedAgent(app);
    const r = await streakService.bump(a.userId, day('2026-06-14T10:00:00Z'));
    expect(r).toBe(1);
    const u = await User.findById(a.userId).select('pomodoroStreak');
    expect(u.pomodoroStreak.count).toBe(1);
  });

  it('is idempotent within the same day', async () => {
    const a = await createAuthedAgent(app);
    await streakService.bump(a.userId, day('2026-06-14T09:00:00Z'));
    const second = await streakService.bump(a.userId, day('2026-06-14T21:00:00Z'));
    expect(second).toBe(1);
  });
});
```

Note: `app` is provided as a global by `buildApp()` side effects? It is not — fix by capturing it. Replace the top of the file's `buildApp();` line with `const app = buildApp();`.

- [ ] **Step 3: Run to confirm failure**

Run: `cd server && npx jest tests/streak.test.js`
Expected: FAIL — `streak.service.js` does not exist.

- [ ] **Step 4: Implement the streak service**

Create `server/src/services/streak.service.js`:

```js
import { User } from '../models/User.js';

const dayKey = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

const diffInDays = (a, b) => {
  const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
};

export function computeNextStreak(prev, now) {
  const today = dayKey(now);
  if (!prev || !prev.lastFocusDate) return { count: 1, lastDay: today };
  const last = dayKey(new Date(prev.lastFocusDate));
  const gap = diffInDays(today, last);
  if (gap === 0) return { count: prev.count, lastDay: today };
  if (gap === 1) return { count: prev.count + 1, lastDay: today };
  return { count: 1, lastDay: today };
}

export const streakService = {
  async bump(userId, now = new Date()) {
    const user = await User.findById(userId).select('pomodoroStreak');
    if (!user) return 0;
    const next = computeNextStreak(user.pomodoroStreak, now);
    user.pomodoroStreak = { count: next.count, lastFocusDate: now };
    await user.save();
    return next.count;
  },
};
```

- [ ] **Step 5: Run the streak tests**

Run: `cd server && npx jest tests/streak.test.js`
Expected: PASS (all six cases).

- [ ] **Step 6: Commit**

```bash
git add server/src/models/User.js server/src/services/streak.service.js server/tests/streak.test.js
git commit -m "feat(streak): per-user daily pomodoro streak math + persistence"
```

### Task 4.2: Bump the streak when a Focus session completes + expose it

**Files:**
- Modify: `server/src/services/pomodoro.service.js`
- Modify: `server/src/services/dashboard.service.js`
- Test: `server/tests/pomodoro.test.js`

- [ ] **Step 1: Write a failing test that completing a Focus session bumps the streak**

Add to `server/tests/pomodoro.test.js` (new `describe` at the end of the file; mirror the existing import style there):

```js
import { User } from '../src/models/User.js';

describe('Pomodoro streak', () => {
  it('bumps the streak when a Focus session is completed', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/pomodoro-sessions').send({
      mode: 'Focus',
      durationMinutes: 25,
      startedAt: new Date(Date.now() - 25 * 60_000).toISOString(),
      endedAt: new Date().toISOString(),
      isCompleted: true,
    });
    const u = await User.findById(a.userId).select('pomodoroStreak');
    expect(u.pomodoroStreak.count).toBe(1);
  });

  it('does not bump for a break session', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/pomodoro-sessions').send({
      mode: 'ShortBreak',
      durationMinutes: 5,
      startedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      endedAt: new Date().toISOString(),
      isCompleted: true,
    });
    const u = await User.findById(a.userId).select('pomodoroStreak');
    expect(u.pomodoroStreak.count).toBe(0);
  });
});
```

If `pomodoro.test.js` does not already import `buildApp`/`createAuthedAgent` and define `app`, copy that header from the top of the existing file (it does — reuse the existing `app`/`createAuthedAgent`; only add the `User` import and the new `describe`).

- [ ] **Step 2: Run to confirm failure**

Run: `cd server && npx jest tests/pomodoro.test.js -t "bumps the streak"`
Expected: FAIL — streak stays 0.

- [ ] **Step 3: Call the streak service from pomodoro.service**

In `server/src/services/pomodoro.service.js`:

Add the import:

```js
import { streakService } from './streak.service.js';
```

Inside `create`, in the `if (session.mode === 'Focus' && session.isCompleted) { ... }` block, after the notification create and before the `incrementPomodoro` block, add:

```js
      await streakService.bump(userId);
```

- [ ] **Step 4: Run the pomodoro tests**

Run: `cd server && npx jest tests/pomodoro.test.js`
Expected: PASS (existing + both new cases).

- [ ] **Step 5: Return `streak` in the dashboard summary**

In `server/src/services/dashboard.service.js`:

Add the import:

```js
import { User } from '../models/User.js';
```

Inside `summary`, after the `setting` lookup added in Task 3.1, add:

```js
    const userDoc = await User.findById(userId).select('pomodoroStreak');
    const streak = userDoc?.pomodoroStreak?.count ?? 0;
```

Add `streak` to the returned object.

- [ ] **Step 6: Add a streak assertion to the dashboard test**

Add to `server/tests/dashboard.test.js` inside the existing `describe`:

```js
  it('returns a streak number (0 by default)', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/dashboard/summary');
    expect(r.body.streak).toBe(0);
  });
```

- [ ] **Step 7: Run dashboard + pomodoro tests**

Run: `cd server && npx jest tests/dashboard.test.js tests/pomodoro.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add server/src/services/pomodoro.service.js server/src/services/dashboard.service.js server/tests/pomodoro.test.js server/tests/dashboard.test.js
git commit -m "feat(streak): bump on focus completion and expose via dashboard"
```

### Task 4.3: Show the streak on the dashboard + pomodoro page

**Files:**
- Create: `client/src/components/dashboard/StreakCard.tsx`
- Modify: `client/src/pages/DashboardPage.tsx`
- Modify: `client/src/pages/PomodoroPage.tsx`

- [ ] **Step 1: Create the StreakCard**

Create `client/src/components/dashboard/StreakCard.tsx`:

```tsx
import { Flame } from 'lucide-react';
import { Card } from '@/components/common/Card';

export function StreakCard({ streak }: { streak: number }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15">
        <Flame className="h-6 w-6" />
      </div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{streak}</div>
        <div className="text-sm text-text-muted">
          day{streak === 1 ? '' : 's'} focus streak
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Render the StreakCard on the dashboard**

In `client/src/pages/DashboardPage.tsx`, add the import:

```tsx
import { StreakCard } from '@/components/dashboard/StreakCard';
```

Add `<StreakCard streak={d.streak} />` as the first child of the two-column grid that currently holds "Pomodoros today" + "Focus time today" — change that grid from `lg:grid-cols-2` to `lg:grid-cols-3` and insert `<StreakCard streak={d.streak} />` before the two existing `<SummaryCard>`s:

```tsx
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StreakCard streak={d.streak} />
        <SummaryCard icon={Timer} label="Pomodoros today"  value={d.todayPomodoros} />
        <SummaryCard icon={Flame} label="Focus time today" value={minutesToHM(d.todayFocusMinutes)} tone="good" />
      </div>
```

- [ ] **Step 3: Show a flame badge on the Pomodoro page**

In `client/src/pages/PomodoroPage.tsx`:

Add the import for the dashboard query and the Flame icon (Flame to the existing lucide import list):

```tsx
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
```

Inside the component, add:

```tsx
  const dash = useDashboardQuery();
  const streak = dash.data?.streak ?? 0;
```

Add a badge near the brand label block (after the `Focus Workspace` span's parent `</div>`), as a sibling inside the top area:

```tsx
      {streak > 0 && (
        <div
          className="absolute right-6 top-16 z-10 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-sm backdrop-blur"
          style={{ textShadow: TEXT_SHADOW }}
          title={`${streak}-day focus streak`}
        >
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="font-medium">{streak}</span>
        </div>
      )}
```

Add `Flame` to the lucide-react import list at the top of the file.

- [ ] **Step 4: Build the client**

Run: `cd client && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/dashboard/StreakCard.tsx client/src/pages/DashboardPage.tsx client/src/pages/PomodoroPage.tsx
git commit -m "feat(streak): streak card on dashboard and flame badge on pomodoro"
```

---

## Feature 5 — Contextual help: `(i)` tooltips + driver.js tours

### Task 5.1: Add driver.js + a reusable InfoTooltip

**Files:**
- Modify: `client/package.json`
- Create: `client/src/components/common/InfoTooltip.tsx`
- Test: `client/src/components/common/__tests__/InfoTooltip.test.tsx`

- [ ] **Step 1: Install driver.js**

Run: `cd client && npm install driver.js@^1.3.6`
Expected: `driver.js` added to `dependencies` in `client/package.json`.

- [ ] **Step 2: Write a failing test for InfoTooltip**

Create `client/src/components/common/__tests__/InfoTooltip.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InfoTooltip } from '../InfoTooltip';

describe('InfoTooltip', () => {
  it('exposes its text via accessible label', () => {
    render(<InfoTooltip text="Helpful hint" />);
    expect(screen.getByLabelText('Helpful hint')).toBeInTheDocument();
  });

  it('reveals the tooltip text on focus', () => {
    render(<InfoTooltip text="Helpful hint" />);
    const btn = screen.getByLabelText('Helpful hint');
    fireEvent.focus(btn);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful hint');
  });
});
```

- [ ] **Step 3: Run to confirm failure**

Run: `cd client && npx vitest run src/components/common/__tests__/InfoTooltip.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement InfoTooltip**

Create `client/src/components/common/InfoTooltip.tsx`:

```tsx
import { useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="text-text-muted transition hover:text-text"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-5 z-50 w-56 -translate-x-1/2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-normal text-text shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 5: Run the test**

Run: `cd client && npx vitest run src/components/common/__tests__/InfoTooltip.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/package.json client/package-lock.json client/src/components/common/InfoTooltip.tsx client/src/components/common/__tests__/InfoTooltip.test.tsx
git commit -m "feat(help): add driver.js dep and reusable InfoTooltip"
```

### Task 5.2: Build a route-keyed tour registry + HelpButton

**Files:**
- Create: `client/src/lib/guides.ts`
- Create: `client/src/components/common/HelpButton.tsx`
- Modify: `client/src/components/layout/Header.tsx`

- [ ] **Step 1: Create the tour registry**

Create `client/src/lib/guides.ts`:

```ts
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const guides: Record<string, DriveStep[]> = {
  '/dashboard': [
    {
      element: '[data-tour="deadline-banner"]',
      popover: {
        title: 'Deadline reminders',
        description: 'Overdue and soon-due tasks surface here. Click one to open it.',
      },
    },
    {
      element: '[data-tour="streak"]',
      popover: {
        title: 'Focus streak',
        description: 'Complete one Pomodoro focus session a day to grow your streak.',
      },
    },
  ],
  '/settings': [
    {
      element: '[data-tour="reminder-window"]',
      popover: {
        title: 'Reminder window',
        description: 'Choose how many hours before a deadline you want to be reminded.',
      },
    },
  ],
};

export function hasGuide(path: string): boolean {
  return (guides[path]?.length ?? 0) > 0;
}

export function runGuide(path: string): void {
  const steps = guides[path];
  if (!steps || steps.length === 0) return;
  // Only show steps whose anchor is actually on the page right now.
  const present = steps.filter(
    (s) => typeof s.element === 'string' && document.querySelector(s.element),
  );
  if (present.length === 0) return;
  driver({ showProgress: true, steps: present }).drive();
}
```

- [ ] **Step 2: Create the HelpButton**

Create `client/src/components/common/HelpButton.tsx`:

```tsx
import { HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { hasGuide, runGuide } from '@/lib/guides';

export function HelpButton() {
  const { pathname } = useLocation();
  if (!hasGuide(pathname)) return null;
  return (
    <button
      onClick={() => runGuide(pathname)}
      aria-label="Show page guide"
      title="Show page guide"
      className="rounded-2xl p-2 text-text-muted hover:bg-bg"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
```

- [ ] **Step 3: Mount HelpButton in the Header**

In `client/src/components/layout/Header.tsx`, add the import:

```tsx
import { HelpButton } from '@/components/common/HelpButton';
```

Add `<HelpButton />` in the right-hand button group, just before `<NotificationBell />`:

```tsx
        <HelpButton />
        <NotificationBell />
```

- [ ] **Step 4: Add tour anchors to the dashboard + settings**

In `client/src/components/dashboard/DeadlineBanner.tsx`, add `data-tour="deadline-banner"` to the outermost `<div>`. (When the banner is null there is no anchor; `runGuide` already filters missing anchors.)

In `client/src/components/dashboard/StreakCard.tsx`, add `data-tour="streak"` to the `<Card>`'s wrapper — pass it through: change the `Card` usage to `<Card className="flex items-center gap-4" data-tour="streak">` (Card spreads `...rest` onto its div, so the data attribute lands on the DOM node).

In `client/src/pages/SettingsPage.tsx`, on the "Deadline reminders" `<Card>`, add `data-tour="reminder-window"`.

- [ ] **Step 5: Add an InfoTooltip to two section headers (demonstrate the pattern)**

In `client/src/pages/DashboardPage.tsx`, wrap the streak grid's context — add an InfoTooltip next to the "Today" heading inside the Card:

```tsx
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            Today
            <InfoTooltip text="Tasks due today. Complete or edit them right here." />
          </h3>
```

Add the import to DashboardPage:

```tsx
import { InfoTooltip } from '@/components/common/InfoTooltip';
```

In `client/src/pages/SettingsPage.tsx`, update the "Deadline reminders" heading:

```tsx
        <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold">
          Deadline reminders
          <InfoTooltip text="We notify you this many hours before a task's deadline." />
        </h3>
```

Add the import to SettingsPage:

```tsx
import { InfoTooltip } from '@/components/common/InfoTooltip';
```

- [ ] **Step 6: Build the client + run the full client test suite**

Run: `cd client && npm run build && npx vitest run`
Expected: PASS (build clean; InfoTooltip + existing store/util tests green).

- [ ] **Step 7: Manual verification (record result)**

Run: `cd client && npm run dev`. On `/dashboard` and `/settings`, click the `?` help button → driver.js tour highlights the anchored elements; hover the `(i)` icons → short hints appear.
State what you observed (tour steps shown, tooltips visible).

- [ ] **Step 8: Commit**

```bash
git add client/src/lib/guides.ts client/src/components/common/HelpButton.tsx client/src/components/layout/Header.tsx client/src/components/dashboard/DeadlineBanner.tsx client/src/components/dashboard/StreakCard.tsx client/src/pages/DashboardPage.tsx client/src/pages/SettingsPage.tsx
git commit -m "feat(help): driver.js page tours + (i) tooltips on key sections"
```

---

## Final verification

- [ ] **Run the full server test suite**

Run: `cd server && npx jest`
Expected: PASS (auth, tasks, pomodoro, notifications, dashboard, settings, statistics, streak).

- [ ] **Run the full client test suite + build**

Run: `cd client && npx vitest run && npm run build`
Expected: PASS.

- [ ] **Manual smoke (record result)**

Run server + client, log in, then:
1. `/calendar` — Back/Next change months.
2. `/settings` — set reminder window to 2h; save.
3. Create a task due in ~1h → within a cron cycle (or by manually invoking the job), a `deadline_soon` notification appears in the bell.
4. `/dashboard` — overdue/due-soon banner shows; complete a Pomodoro focus session on `/pomodoro` → streak increments and the flame badge shows.
5. `?` help button runs the tour; `(i)` icons show hints.

State what you observed for each.

---

## Notes / decisions baked in

- **Day boundaries for streak use UTC start-of-day** (`toISOString().slice(0,10)`). This keeps tests deterministic and is consistent server-side. If you later want local-timezone streaks, pass an offset into `computeNextStreak` — out of scope here.
- **Streak is read through the dashboard summary**, not `/auth/me`, because the dashboard query is already invalidated (`['dashboard']`) whenever a session is created (`usePomodoroQueries.ts` + `pomodoroStore.complete`). No new polling needed.
- **The deadline-soon cron already exists** and runs every 15 min (`jobs/index.js`); we only changed its window source. No new scheduling.
- **driver.js tours degrade gracefully**: `runGuide` filters out steps whose anchor isn't currently in the DOM (e.g. the banner is hidden when there's nothing due), so a tour never points at nothing.
