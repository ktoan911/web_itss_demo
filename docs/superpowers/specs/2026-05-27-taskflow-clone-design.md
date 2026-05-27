# TaskFlow Clone — Design Spec

**Date:** 2026-05-27
**Status:** Approved (pending user review of this document)
**Author:** Brainstorming session

## 1. Overview

A productivity web app inspired by taskflow.pro.vn. Users sign up, manage tasks with deadlines and priorities, run Pomodoro focus sessions tied to tasks, view tasks on a calendar, and track productivity statistics. Excludes Study Together, realtime chat, video, and any collaborative features.

## 2. Stack

**Backend**
- Node.js 20+ with Express
- MongoDB 6+ via Mongoose
- JSON Web Tokens (jsonwebtoken)
- bcrypt for password hashing
- zod for input validation
- node-cron for scheduled jobs
- helmet, express-rate-limit, express-mongo-sanitize for security
- Jest + Supertest + mongodb-memory-server for testing

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS (`darkMode: 'class'`, CSS-variable theming)
- React Router DOM 6
- Axios
- Zustand (auth, theme, pomodoro engine — client state only)
- @tanstack/react-query (all server state)
- React Hook Form + Zod
- Recharts (statistics)
- react-big-calendar + date-fns (calendar)
- sonner (toasts)
- lucide-react (icons)
- Vitest + React Testing Library

**Tooling**
- ESLint + Prettier (+ prettier-plugin-tailwindcss on client)
- TypeScript strict mode on client (`strict`, `noUncheckedIndexedAccess`)

## 3. Repo layout

Monorepo with two independent packages (no workspaces — each side has its own `package.json` and is run separately).

```
web_itss_demo/
├── README.md
├── .gitignore
├── docs/superpowers/specs/2026-05-27-taskflow-clone-design.md   # this file
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Task.js
│   │   │   ├── PomodoroSession.js
│   │   │   ├── UserSetting.js
│   │   │   └── Notification.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   │   ├── auth.js
│   │   │   ├── error.js
│   │   │   └── validate.js
│   │   ├── validators/
│   │   ├── utils/
│   │   │   ├── passwordHasher.js
│   │   │   ├── jwt.js
│   │   │   ├── dateRange.js
│   │   │   ├── asyncHandler.js
│   │   │   └── AppError.js
│   │   ├── jobs/
│   │   │   ├── overdueChecker.js
│   │   │   └── deadlineSoonReminder.js
│   │   └── seed/
│   │       └── seed.js
│   └── tests/
└── client/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/
        ├── routes/
        │   ├── AppRouter.tsx
        │   ├── ProtectedRoute.tsx
        │   └── PublicOnlyRoute.tsx
        ├── pages/
        ├── components/
        │   ├── layout/
        │   ├── common/
        │   ├── tasks/
        │   ├── pomodoro/
        │   ├── dashboard/
        │   ├── calendar/
        │   ├── statistics/
        │   └── notifications/
        ├── hooks/
        │   ├── queries/
        │   ├── useAuth.ts
        │   ├── useDebounce.ts
        │   ├── useTheme.ts
        │   └── usePomodoroEngine.ts
        ├── store/
        │   ├── authStore.ts
        │   ├── themeStore.ts
        │   └── pomodoroStore.ts
        ├── types/
        ├── utils/
        └── lib/
            ├── queryClient.ts
            └── audio.ts
```

## 4. Boundaries & architectural rules

- **Controllers are thin.** They receive req/res, call a service with `req.user.id` plus body/query, and return JSON. They contain no business logic.
- **Services are pure of HTTP.** They never import express or touch req/res. Every service method that returns user-owned data takes `userId` as the first argument and includes it in the Mongoose filter.
- **Models own indexes and virtuals.** Schemas declare indexes and `isOverdue` virtual; services rely on these rather than recomputing.
- **No IDOR.** Every read/write of user-scoped data filters by `userId`. Returning 404 when a doc exists but belongs to another user (don't leak existence with 403).
- **Frontend server state lives in React Query.** Zustand is reserved for client-only state: auth (token, user), theme, pomodoro engine.
- **Pomodoro engine lives in the store, not in a component.** The `setInterval` handle and `endsAt` timestamp live in `pomodoroStore`, so the timer survives route changes and re-renders.
- **Components are dumb where possible.** Pages compose hooks (`useTaskQueries`, etc.) and pass props down. Logic doesn't leak into JSX.

## 5. Domain model (MongoDB collections)

Identifiers: MongoDB `ObjectId` (the spec listed `Guid`; switching to ObjectId is the Mongo-idiomatic equivalent). Enums (Priority, Status, Mode) stored as **string** values ("Low" | "Medium" | "High", etc.) — simpler than the numeric mapping in the original spec, and the spec's API examples already use strings in some places.

### 5.1 User
```
_id, fullName, email (unique, lowercase, indexed),
passwordHash (select: false), createdAt, updatedAt
```

### 5.2 Task
```
_id, userId (ref User, indexed),
title, description?,
deadline (Date),
priority: 'Low' | 'Medium' | 'High',
priorityRank: 1 | 2 | 3      // mirror of priority for index-friendly sort
status: 'Todo' | 'InProgress' | 'Completed',
estimatedPomodoros (min 1, default 1),
completedPomodoros (default 0),
completedAt?,
createdAt, updatedAt

virtual isOverdue = deadline < now AND status !== 'Completed'

indexes:
  { userId: 1, deadline: 1 }
  { userId: 1, status: 1 }
  { userId: 1, priorityRank: -1 }
  text(title, description)
```

`priorityRank` is set by a Mongoose pre-save hook from the `priority` string. It exists because sort by priority needs an indexable numeric field — pure string sort would put "High" before "Low" alphabetically (wrong) and an aggregation `$switch` cannot use an index.

### 5.3 PomodoroSession
```
_id, userId (indexed), taskId? (ref Task),
mode: 'Focus' | 'ShortBreak' | 'LongBreak',
durationMinutes, startedAt, endedAt?, isCompleted (default false)

indexes:
  { userId: 1, startedAt: -1 }
  { taskId: 1, isCompleted: 1 }
```

### 5.4 UserSetting (1:1 with User)
```
_id, userId (unique, indexed),
focusDuration (default 25),
shortBreakDuration (default 5),
longBreakDuration (default 15),
theme: 'light' | 'dark' (default 'light'),
notificationEnabled (default true)
```
Created during register flow as part of the same operation.

### 5.5 Notification
```
_id, userId (indexed),
title, message,
type: 'task_overdue' | 'task_completed' | 'pomodoro_done'
    | 'deadline_soon' | 'estimated_reached',
taskId? (ref Task, sparse),
isRead (default false),
createdAt

indexes:
  { userId: 1, isRead: 1, createdAt: -1 }
  { userId: 1, type: 1, taskId: 1 }   // for dedup queries
```

## 6. API surface

All routes prefixed with `/api`. Auth-protected routes are marked ✓.

### 6.1 Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | – | body: fullName, email, password, confirmPassword |
| POST | `/auth/login` | – | body: email, password |
| GET | `/auth/me` | ✓ | returns current user |

### 6.2 Tasks
| Method | Path | Auth |
|---|---|---|
| GET | `/tasks` | ✓ |
| GET | `/tasks/:id` | ✓ |
| POST | `/tasks` | ✓ |
| PUT | `/tasks/:id` | ✓ |
| DELETE | `/tasks/:id` | ✓ |
| PATCH | `/tasks/:id/status` | ✓ |
| PATCH | `/tasks/:id/complete` | ✓ |
| PATCH | `/tasks/:id/pomodoro/increment` | ✓ |

`GET /tasks` query params: `search`, `status`, `priority`, `deadlineFilter` (`today` | `upcoming` | `overdue` | `completed`), `sortBy` (`deadline` | `priority` | `newest`).

### 6.3 Pomodoro
| Method | Path | Auth |
|---|---|---|
| POST | `/pomodoro-sessions` | ✓ |
| GET | `/pomodoro-sessions/recent` | ✓ |
| GET | `/pomodoro-sessions/statistics` | ✓ |

### 6.4 Dashboard / Statistics
| Method | Path | Auth |
|---|---|---|
| GET | `/dashboard/summary` | ✓ |
| GET | `/statistics/tasks?range=7days\|30days\|month` | ✓ |
| GET | `/statistics/pomodoros?range=...` | ✓ |

### 6.5 Settings
| Method | Path | Auth |
|---|---|---|
| GET | `/settings` | ✓ |
| PUT | `/settings` | ✓ |
| PUT | `/settings/profile` | ✓ |
| PUT | `/settings/password` | ✓ |

### 6.6 Notifications
| Method | Path | Auth |
|---|---|---|
| GET | `/notifications` | ✓ |
| PATCH | `/notifications/:id/read` | ✓ |
| PATCH | `/notifications/read-all` | ✓ |

### 6.7 Error response shape
```json
{ "error": { "message": "...", "code": "OPTIONAL_CODE", "fields": { "fieldName": "..." } } }
```
- 400: validation (zod errors → `fields`)
- 401: missing/invalid token
- 403: forbidden (rare; mostly we use 404)
- 404: not found / not owned
- 409: conflict (duplicate email)
- 500: unexpected

## 7. Business logic

### 7.1 Register
1. Validate body via zod (email format, password ≥ 6, confirm matches).
2. Reject 409 if email exists.
3. `bcrypt.hash(password, BCRYPT_COST)`.
4. Create `User` and `UserSetting` (default values). If the setting create fails after the user is saved, delete the user to keep state consistent.
5. Sign JWT `{ id, email }` with `JWT_EXPIRES_IN`.
6. Respond `{ token, user: { id, fullName, email } }`.

### 7.2 Login
1. Find user by lowercase email, `select('+passwordHash')`.
2. `bcrypt.compare`. On mismatch → 401 with generic message.
3. Sign JWT, respond `{ token, user }`.

### 7.3 Task list
```
filter = { userId }
if search       : filter.$text = { $search: search }
if status       : filter.status = status
if priority     : filter.priority = priority
if deadlineFilter:
  today     → deadline ∈ [startOfDay, endOfDay]
  upcoming  → deadline > now AND status !== Completed
  overdue   → deadline < now AND status !== Completed
  completed → status = Completed

sort:
  deadline → { deadline: 1 }
  priority → { priorityRank: -1 }
  newest   → { createdAt: -1 }

return tasks (with isOverdue virtual via toJSON)
```

### 7.4 Mark complete
- `findOneAndUpdate({ _id, userId }, { status: 'Completed', completedAt: now })`.
- If user has `notificationEnabled`, create a `task_completed` notification.

### 7.5 Pomodoro create flow
1. Validate body (mode, durationMinutes, startedAt, endedAt, taskId?).
2. If `taskId` present, verify it belongs to `userId`; otherwise 404.
3. Save the session.
4. If `mode === 'Focus' && isCompleted === true`:
   a. Create a `pomodoro_done` notification (respects `notificationEnabled`).
   b. If `taskId`:
      - Increment `task.completedPomodoros` by 1.
      - If `task.status === 'Todo'`, set it to `'InProgress'`.
      - If `task.completedPomodoros >= task.estimatedPomodoros` and we haven't already created an `estimated_reached` notification for this task, create one.
5. Respond with the session.

The estimated_reached dedup key is `{ userId, type: 'estimated_reached', taskId }` — at most one per task lifetime.

### 7.6 Dashboard summary
A single endpoint returning all metrics in one round trip via `Promise.all`:
```
totalTasks, completedTasks, inProgressTasks, overdueTasks,
todayPomodoros, todayFocusMinutes,
upcomingTasks (next 5),
recentSessions (last 5),
completionChart (last 7 days, [{date, count}])
```

### 7.7 Statistics range parsing
```
parseRange('7days')  → { start: today - 6 days at 00:00, end: now }
parseRange('30days') → { start: today - 29 days at 00:00, end: now }
parseRange('month')  → { start: startOfMonth(now), end: now }
```
Implementation uses `date-fns`.

### 7.8 Cron jobs (in-process via node-cron)

Both jobs respect each user's `notificationEnabled` and dedup against existing notifications.

**overdueChecker** — every 5 minutes. Find tasks where `deadline < now`, `status !== 'Completed'`, and there is no `task_overdue` notification for that task in the last 24h. Bulk-insert notifications.

**deadlineSoonReminder** — every 15 minutes. Find tasks where `deadline ∈ (now, now + 1h)`, `status !== 'Completed'`, and no `deadline_soon` notification has ever been created for that task. Insert one notification per matched task.

### 7.9 Auth middleware
1. Read `Authorization: Bearer <token>` header.
2. `jwt.verify`. Failure → 401.
3. Set `req.user = { id, email }`.
4. Call `next()`.

### 7.10 Security middleware (mounted in `app.js`)
- `helmet()` — security headers.
- `cors({ origin: CLIENT_ORIGIN })`.
- `express.json({ limit: '100kb' })`.
- `express-mongo-sanitize()` — strip `$` and `.` from request keys.
- `express-rate-limit` on `/api/auth/*`: 10 requests per 15 minutes per IP.

## 8. Frontend architecture

### 8.1 axiosClient
```ts
const api = axios.create({ baseURL: '/api', timeout: 15000 });

api.interceptors.request.use(cfg => {
  const t = useAuthStore.getState().token;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/')) {
      useAuthStore.getState().logout();
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);
```
Vite dev proxy: `/api` → `http://localhost:4000`.

### 8.2 React Query
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (count, err) => err?.response?.status === 401 ? false : count < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
```

**Query keys**
```
['auth', 'me']
['tasks', filters]
['tasks', id]
['pomodoros', 'recent']
['pomodoros', 'stats']
['dashboard']
['statistics', 'tasks', range]
['statistics', 'pomodoros', range]
['settings']
['notifications']     // refetchInterval: 30_000 when authenticated
```

**Invalidation map**
| Mutation | Invalidates |
|---|---|
| createTask | `['tasks']`, `['dashboard']` |
| updateTask | `['tasks']`, `['tasks', id]`, `['dashboard']` |
| deleteTask | `['tasks']`, `['dashboard']` |
| changeStatus / markCompleted | `['tasks']`, `['dashboard']`, `['statistics']` |
| createPomodoroSession | `['pomodoros', 'recent']`, `['tasks']`, `['dashboard']`, `['statistics']` |
| updateSettings / Profile / Password | `['settings']`, `['auth', 'me']` |
| markNotifRead / readAll | `['notifications']` |

Optimistic updates on `markCompleted` and `deleteTask`.

### 8.3 Stores

**authStore** (zustand + persist on `taskflow-auth`)
```
{ token, user, login(token, user), logout(), setUser(u), isAuthenticated() }
```
On app mount: if token exists, call `GET /auth/me`; on 401, `logout()`.

**themeStore** (persist)
```
{ theme: 'light' | 'dark', setTheme(t), toggle() }
```
Initialization order: persisted value → settings response → `prefers-color-scheme`. `useTheme()` applies/removes the `dark` class on `<html>`.

**pomodoroStore** (session-only, no persist)
```
{
  mode, status, durations,                      // hydrated from settings
  endsAt, remainingMs, startedAt, selectedTaskId,
  intervalId, focusCount,
  hydrateFromSettings(s), setMode(m), selectTask(id|null),
  start(), pause(), reset(), skip(),
  _tick(), _complete()
}
```

**Engine semantics**
- `start()` from `idle`: `endsAt = Date.now() + durations[mode] * 60000`, `startedAt = Date.now()`, `status = 'running'`, kick off `setInterval(_tick, 250)`.
- `start()` from `paused`: `endsAt = Date.now() + remainingMs`, resume interval.
- `pause()`: `remainingMs = endsAt - Date.now()`, clear interval, `status = 'paused'`.
- `reset()`: clear interval, `status = 'idle'`, `remainingMs = durations[mode] * 60000`.
- `skip()`: like reset, but does **not** record a session.
- `_tick()`: if `Date.now() >= endsAt` → `_complete()`.
- `_complete()`:
  - clear interval.
  - if `mode === 'Focus'`: enqueue `createPomodoroSessionMutation({ taskId: selectedTaskId, mode: 'Focus', durationMinutes, startedAt, endedAt: Date.now(), isCompleted: true })`, increment `focusCount`.
  - play notify audio (gesture-unlocked at first user start), `toast.success("Time's up!")`.
  - set `status = 'idle'`. Suggest next mode in UI: focus 1–3 → ShortBreak; focus 4 → LongBreak (no auto-start).

The store's `endsAt`-based design means the timer is accurate even when the tab is backgrounded — Chrome's interval throttling no longer affects correctness, only repaint rate.

### 8.4 Routing
```tsx
<Routes>
  <Route element={<PublicOnlyRoute />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
  </Route>
  <Route path="/" element={<Navigate to="/dashboard" />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```
Each page is `React.lazy(() => import(...))` with a top-level `<Suspense fallback={<Loading />}>`.

### 8.5 Forms
One zod schema per form, shared between RHF resolver and TS type:
```ts
export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  deadline: z.coerce.date(),
  priority: z.enum(['Low', 'Medium', 'High']),
  estimatedPomodoros: z.coerce.number().int().min(1),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
```

### 8.6 Theming (Tailwind)
`tailwind.config.js` extends colors with CSS variables:
```js
colors: {
  bg:      'rgb(var(--bg) / <alpha-value>)',
  surface: 'rgb(var(--surface) / <alpha-value>)',
  border:  'rgb(var(--border) / <alpha-value>)',
  text:    { DEFAULT: 'rgb(var(--text))', muted: 'rgb(var(--text-muted))' },
  primary: { /* 50..950 */ },
  priority:{ low: '#16a34a', medium: '#f59e0b', high: '#dc2626' },
  status:  { todo: '#64748b', progress: '#2563eb', done: '#16a34a', overdue: '#dc2626' },
}
```
`index.css` defines `:root { --bg ... }` and `.dark { --bg ... }`. Components use semantic classes (`bg-surface`, `text-text-muted`) instead of `dark:` everywhere.

## 9. UI specifications

### 9.1 AppLayout
- Sidebar 256px, fixed on `lg+`, drawer on `<lg`. Items: Logo, Dashboard, Tasks, Pomodoro, Calendar, Statistics, Settings, Logout. No "Study Together".
- Header h-16 with: page title, "+ Add Task" quick button (opens TaskFormModal pre-filled with end-of-day deadline), notification bell (unread badge cap "9+"), theme toggle, avatar (initials) with logout menu.

### 9.2 LoginPage / RegisterPage
- Centered card, `max-w-md`, soft gradient background.
- Login: email, password.
- Register: fullName, email, password, confirmPassword (zod refines `confirm === password`).
- On success: store token, navigate `/dashboard`.

### 9.3 DashboardPage
- Greeting "Welcome back, {firstName}" + today's date.
- Row 1 (4 SummaryCards on `lg`): Total / Completed / In Progress / Overdue.
- Row 2 (2 wide SummaryCards): Pomodoros Today, Focus Time Today.
- Row 3 (2-col on `lg`): Today's Tasks list (5), Upcoming Deadlines list (5).
- Row 4 (2-col on `lg`): Recent Pomodoro Sessions (5), Completion mini chart (last 7 days, BarChart, h-32).
- Empty state when no tasks: "Welcome! Create your first task" with primary button.

### 9.4 TasksPage
- Header: "My Tasks" + "+ Add Task".
- Toolbar: search (300ms debounce), Status / Priority / Deadline / Sort dropdowns, Grid|List view toggle.
- Filter state mirrored to URL search params.
- TaskCard (grid view): priority dot + title, 2-line description clamp, deadline + pomodoro progress (`2/4`), status badge, overdue badge if applicable, action buttons: Complete, Edit, Delete.
- TaskRow (list view): compact one-line layout with the same data.
- Optimistic delete with `ConfirmDialog`. Optimistic complete.
- TaskFormModal fields: Title, Description, Deadline (datetime-local), Priority (segmented control), Estimated Pomodoros (number). Reused for create / edit / view.

### 9.5 PomodoroPage
- Mode tabs: Focus / Short Break / Long Break. Switching while running shows confirm.
- ProgressRing SVG centered with mm:ss inside; ring color by mode (Focus = primary, ShortBreak = green, LongBreak = blue).
- Currently focusing on: `{task.title}` or "No task".
- Buttons: Reset, Start/Pause (toggle), Skip.
- FocusTaskSelector dropdown showing tasks with status `Todo` or `InProgress`, plus "No task". Each option shows title and `2/4 🍅`.
- Today's totals: sessions count + total focus minutes.
- Recent sessions list (last 5).
- On Focus completion: audio + toast; if `task.completedPomodoros >= estimatedPomodoros` show small modal with [Mark Complete] [Keep Going].

### 9.6 CalendarPage
- react-big-calendar localized with `dateFnsLocalizer`. Month + Week views. Header navigation.
- Events = tasks (`start = end = deadline`, `allDay: true`). `eventPropGetter` colors events by priority.
- `onSelectEvent` opens TaskFormModal in view/edit mode.
- `onSelectSlot` highlights the day and updates DayTasksPanel below the calendar.
- DayTasksPanel reuses `<TaskRow>`.
- Light/dark styling overrides applied in `index.css` after the library's base CSS.

### 9.7 StatisticsPage
- Range selector: 7 days / 30 days / Month.
- BarChart Tasks Completed; BarChart Pomodoros Completed; LineChart Focus Minutes.
- PieChart Tasks by Priority; PieChart Tasks by Status.
- Skeleton loading; EmptyState "Not enough data" when all series are empty.

### 9.8 SettingsPage
- Each section is its own RHF form with its own Save button.
- Profile: fullName editable, email read-only.
- Change Password: currentPassword, newPassword, confirmNewPassword (zod refine).
- Pomodoro Durations: focus / short break / long break. After save, `pomodoroStore.hydrateFromSettings(...)` so the engine picks up changes immediately.
- Preferences: theme (radio Light/Dark), notificationEnabled (checkbox).

### 9.9 Notifications
- Bell in Header, popover panel `w-80` showing the latest 10 with relative time (`formatDistanceToNow`).
- Item icon depends on `type`. Unread items show a dot.
- Click an item: markRead mutation; if `taskId` is set, navigate `/tasks?focus={taskId}` and open the task modal.
- Footer "Mark all as read" button.
- Popover refetches every 30s while authenticated.

### 9.10 Empty / Loading / Error states
| Page | Empty | Loading | Error |
|---|---|---|---|
| Tasks | "No tasks yet…" + Add button | 3-card skeleton | "Couldn't load tasks. [Retry]" |
| Pomodoro recent | "No sessions yet today" | 3-row skeleton | – |
| Dashboard | "Welcome! Create your first task" | card skeleton | retry button |
| Calendar panel | "No tasks on this day" | calendar skeleton | – |
| Statistics | "Not enough data" | chart skeleton | retry |
| Notifications | "You're all caught up 🎉" | item skeleton | – |

### 9.11 Responsive
- `<sm`: sidebar drawer, single column, charts full width, modals near-fullscreen.
- `sm-md`: drawer sidebar, 2-col dashboard.
- `lg+`: fixed sidebar, full grid layouts.

### 9.12 Accessibility
- `aria-label` on icon-only buttons.
- Modals: focus trap, Escape closes, focus returns to trigger.
- Form inputs have `<label>` and `aria-describedby` linking error messages.
- Priority badges include both color and an icon/text so contrast/colorblind users still get the signal.

## 10. Audio behavior

`lib/audio.ts` exposes `unlock()` and `playNotify()`. On the user's first Start press in pomodoroStore, the store calls `audio.unlock()` once: it plays then immediately pauses a silent buffer so subsequent `play()` calls work in browsers that block autoplay.

## 11. Cron job lifecycle

Both cron jobs are started in `server/src/index.js` after a successful Mongo connection and before `app.listen`. They are no-ops when `NODE_ENV === 'test'`. Each job:
1. Fetches candidate users / tasks scoped to those with notifications enabled.
2. Performs a `find` against existing notifications to dedup.
3. Bulk-inserts new notifications with `insertMany`.

## 12. Seed script

`npm run seed` (or `npm run seed:reset`) creates:
- 1 user `demo@taskflow.com` / `123456` with default `UserSetting`.
- 8 tasks: 2 due today, 2 upcoming, 1 overdue, 3 completed — spread across priorities.
- ~20 PomodoroSessions distributed across the last 14 days, mostly Focus, some breaks, all `isCompleted: true`.
- 3 sample notifications (1 unread, 2 read).

`--reset` first drops the relevant collections.

## 13. Environment

`server/.env.example`:
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=replace-with-random-32-byte-hex
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
BCRYPT_COST=10
```
`config/env.js` validates with zod at boot and exits if anything is missing/invalid.

`client/.env.example`:
```
VITE_API_BASE_URL=/api
```

## 14. Scripts

**server/package.json**
```
dev          nodemon src/index.js
start        node src/index.js
seed         node src/seed/seed.js
seed:reset   node src/seed/seed.js --reset
test         jest --runInBand
test:watch   jest --watch
lint         eslint src tests
format       prettier --write "src/**/*.js" "tests/**/*.js"
```

**client/package.json**
```
dev          vite
build        tsc -b && vite build
preview      vite preview
lint         eslint . --ext ts,tsx
typecheck    tsc --noEmit
format       prettier --write "src/**/*.{ts,tsx,css}"
test         vitest
```

## 15. Testing strategy

### 15.1 Backend (Jest + Supertest + mongodb-memory-server)
~25 integration tests, covering each route's happy path plus a small set of edge cases.

```
auth.test.js           register, login, duplicate email, wrong password, /me without token
tasks.test.js          CRUD, filters (status/priority/deadline/search/sort), IDOR
pomodoro.test.js       focus completion side effects (counter, status, estimated_reached dedup),
                       cross-user taskId rejection
dashboard.test.js      summary numbers match a small seed
statistics.test.js     range parsing for 7days / 30days / month
settings.test.js       update durations, change password (current correct/wrong)
notifications.test.js  list / markRead / markAllRead / overdue dedup window
```

A `createAuthedAgent(email)` helper registers a user and returns a supertest agent with the Bearer header preset. Cron logic is tested by importing the job's `run()` function directly — the scheduler itself is not tested.

### 15.2 Frontend (Vitest + RTL)
Three critical tests only — this is an MVP, not a coverage exercise:
- `pomodoroStore.test.ts`: start → pause → resume keeps `remainingMs` correct; tick reaching `endsAt` triggers completion.
- `taskUtils.test.ts`: `isOverdue`, `priorityRank`, `deadlineFilter` predicates.
- `LoginPage.test.tsx`: invalid submit shows errors; valid submit navigates.

## 16. Run order (developer first time)

```
1. cd server
2. cp .env.example .env       # set MONGO_URI and JWT_SECRET
3. npm install
4. npm run seed:reset
5. npm run dev                # http://localhost:4000

6. cd ../client
7. npm install
8. npm run dev                # http://localhost:5173

9. login: demo@taskflow.com / 123456
```

## 17. README outline

```
# TaskFlow Clone

## Stack
## Project structure
## Prerequisites (Node 20+, MongoDB 6+)
## Setup & run (server, client)
## Demo account
## API endpoints (the table from §6)
## Scripts cheatsheet
## Security notes
  - Tokens in localStorage per spec; XSS risk noted, CSP recommended for production.
  - Passwords hashed with bcrypt (cost 10).
  - All data filtered by JWT userId.
## Not implemented (intentional)
  - Study Together
  - Realtime chat / video call
  - Forgot password
## Tests
```

## 18. Git hygiene

`.gitignore` (root):
```
node_modules/
.env
.env.local
dist/
build/
coverage/
*.log
.DS_Store
.vscode/
.idea/
client/dist/
server/dist/
```

Commits follow conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

## 19. Out of scope (explicit)

- Study Together and anything related (rooms, chat, video, presence).
- Realtime channels (WebSocket / SSE).
- Forgot password / email sending.
- E2E browser tests (Playwright/Cypress).
- Docker compose, CI/CD, deployment scripts.
- i18n — UI is English only.
- File upload, avatar images.
- Recurring tasks, subtasks, tags, projects.

## 20. Acceptance criteria

The project is considered done when:
- A user can register, log in, and log out.
- A user can create / edit / delete / complete tasks.
- Filtering, searching, and sorting tasks works.
- The Pomodoro timer runs accurately for Focus / Short / Long modes; completing a Focus session writes a `PomodoroSession`, increments the selected task's pomodoro count, and (if Todo) flips it to InProgress.
- Dashboard, Statistics, and Calendar all read live data from MongoDB.
- Settings changes (profile, password, durations, theme, notifications) persist and take effect immediately.
- Notifications appear for: task overdue, task completed, pomodoro done, deadline within 1h, estimated reached.
- The UI is responsive on desktop, tablet, and mobile, and supports light/dark themes.
- The project builds and runs without errors via the documented scripts.
- No Study Together feature exists in code or UI.
