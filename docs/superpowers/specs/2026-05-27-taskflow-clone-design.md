# TaskFlow Clone — Design Spec

**Date:** 2026-05-27
**Status:** Approved (brainstorming) → ready for implementation plan
**Reference:** Inspired by https://www.taskflow.pro.vn/

## 1. Goal

Build a productivity web app clone of TaskFlow with these modules: Authentication, Dashboard, Task Management, Pomodoro Timer, Calendar/Schedule, Statistics, Settings, basic Notifications. Real backend + real database, clean structure, modern minimal UI, responsive.

**Out of scope (intentional):**
- Study Together (all related features)
- Realtime chat / video call / collaborative rooms / WebSocket study sessions
- Forgot-password flow
- E2E browser tests, Docker compose, deployment scripts, i18n, avatar upload, recurring tasks/subtasks/tags/projects

## 2. Tech Stack (decided)

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS (`darkMode: 'class'`, CSS-vars-based tokens)
- React Router DOM v6
- @tanstack/react-query (server state) + Zustand (client state: auth, theme, pomodoro engine)
- Axios with interceptors
- React Hook Form + Zod (+ `@hookform/resolvers`)
- Recharts
- react-big-calendar + date-fns
- sonner (toasts), lucide-react (icons), clsx
- Vitest + @testing-library/react (minimal critical tests)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken) + bcryptjs
- node-cron (in-process scheduled jobs)
- helmet, express-rate-limit, express-mongo-sanitize, cors
- zod (request validation)
- date-fns
- Jest + Supertest + mongodb-memory-server

**Note:** Spec mục 13/19/20 (ASP.NET Core / EF Core / SQL Server) was a copy-paste artifact and is explicitly **discarded** in favor of the Node + MongoDB stack from spec mục 1.

## 3. Architecture & Repo Layout

Monorepo, no workspaces — `server/` and `client/` are independent npm projects with their own `package.json`.

```
web_itss_demo/
├── README.md
├── .gitignore
├── docs/superpowers/specs/
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js              # entry: load env, connect DB, start cron, listen
│   │   ├── app.js                # express app: helmet, cors, json, routes, errorHandler
│   │   ├── config/
│   │   │   ├── env.js            # zod-validated env loader
│   │   │   └── db.js             # mongoose.connect
│   │   ├── models/               # User, Task, PomodoroSession, UserSetting, Notification
│   │   ├── routes/               # one router per resource
│   │   ├── controllers/          # thin: req/res only
│   │   ├── services/             # business logic; first arg is userId
│   │   ├── middlewares/          # auth, errorHandler, validate(zod), rateLimit
│   │   ├── validators/           # zod schemas per route
│   │   ├── utils/                # password, jwt, dateRange, asyncHandler, AppError
│   │   ├── jobs/                 # overdueChecker.js, deadlineSoonReminder.js
│   │   └── seed/                 # seed.js
│   └── tests/                    # integration: jest + supertest
└── client/
    ├── package.json
    ├── vite.config.ts            # proxy /api → http://localhost:4000
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx              # React root + QueryClientProvider + BrowserRouter
        ├── App.tsx               # ThemeProvider + Toaster + AppRouter
        ├── index.css             # Tailwind layers + CSS vars (light/dark)
        ├── api/                  # axiosClient.ts + per-resource api files
        ├── routes/               # AppRouter, ProtectedRoute, PublicOnlyRoute
        ├── pages/                # 7 pages, each lazy-loaded
        ├── components/
        │   ├── layout/           # AppLayout, Sidebar, Header, ThemeToggle, NotificationBell
        │   ├── common/           # Button, Input, Select, Textarea, Modal, Drawer, Card, Badge, EmptyState, Loading, ErrorState, ConfirmDialog
        │   ├── tasks/            # TaskCard, TaskRow, TaskList, TaskFormModal, TaskFilters, TaskStatusBadge, TaskPriorityBadge, TaskQuickAddButton
        │   ├── pomodoro/         # PomodoroTimer, PomodoroModeTabs, FocusTaskSelector, PomodoroHistoryList, ProgressRing
        │   ├── dashboard/        # SummaryCard, TodayTasks, UpcomingTasks, RecentPomodoros, CompletionMiniChart
        │   ├── calendar/         # CalendarView, DayTasksPanel
        │   ├── statistics/       # RangeSelector, TaskCompletionChart, PomodoroChart, FocusMinutesChart, PriorityPie, StatusPie
        │   └── notifications/    # NotificationBell, NotificationList, NotificationItem
        ├── hooks/
        │   ├── queries/          # one file per resource: useTaskQueries.ts, etc.
        │   ├── useAuth.ts
        │   ├── useDebounce.ts
        │   ├── useTheme.ts
        │   └── usePomodoroEngine.ts
        ├── store/                # authStore, themeStore, pomodoroStore
        ├── types/                # auth, task, pomodoro, statistics, settings, notification
        ├── utils/                # dateUtils, taskUtils, formatters, env
        ├── lib/                  # queryClient.ts, audio.ts
        └── validators/           # zod schemas shared by forms
```

**Boundaries:**
- Controllers stay thin and call services. Services do not import express types.
- Every service method receives `userId` as the first argument; every Mongoose query filters by `userId` to prevent IDOR.
- Frontend uses React Query for server state. Zustand stores hold only client state.

## 4. Backend Design

### 4.1 Mongoose models

Mongo IDs are `ObjectId` (not `Guid` as spec mục 11 implied). Enums are stored as **strings**, not ints.

**User**
```
_id, fullName, email (unique, lowercase, indexed),
passwordHash (select: false), createdAt, updatedAt
```

**Task**
```
_id, userId (ref User, indexed),
title, description?,
deadline (Date, required),
priority: 'Low' | 'Medium' | 'High',
priorityRank: 1|2|3 (auto-synced on save; used for index-friendly sort),
status: 'Todo' | 'InProgress' | 'Completed',
estimatedPomodoros (min 1, default 1),
completedPomodoros (default 0),
completedAt?,
createdAt, updatedAt
virtual: isOverdue = deadline < now && status !== 'Completed'
toJSON: { virtuals: true }
indexes:
  { userId: 1, deadline: 1 }
  { userId: 1, status: 1 }
  text: { title, description }
```

**PomodoroSession**
```
_id, userId (indexed), taskId? (ref Task, sparse),
mode: 'Focus' | 'ShortBreak' | 'LongBreak',
durationMinutes, startedAt, endedAt?, isCompleted (default false)
indexes:
  { userId: 1, startedAt: -1 }
  { taskId: 1, isCompleted: 1 }
```

**UserSetting** (1-1 with User; created on register)
```
_id, userId (unique, indexed),
focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
theme: 'light' | 'dark' (default 'light'),
notificationEnabled: true (default)
```

**Notification**
```
_id, userId (indexed),
title, message,
type: 'task_overdue' | 'task_completed' | 'pomodoro_done' | 'deadline_soon' | 'estimated_reached',
taskId? (ref Task, sparse),
isRead (default false),
createdAt
indexes:
  { userId: 1, isRead: 1, createdAt: -1 }
dedup rule (in jobs/services):
  before insert, check existing { userId, type, taskId, createdAt > now - dedupWindow }
  windows: overdue 24h, deadline_soon = once per task, estimated_reached = once per task
```

### 4.2 API endpoints (REST, prefix `/api`)

| Method | Path | Auth | Service |
|---|---|---|---|
| POST | `/auth/register` | – | authService.register |
| POST | `/auth/login` | – | authService.login |
| GET | `/auth/me` | ✓ | authService.me |
| GET | `/tasks` | ✓ | taskService.list(userId, query) |
| GET | `/tasks/:id` | ✓ | taskService.get |
| POST | `/tasks` | ✓ | taskService.create |
| PUT | `/tasks/:id` | ✓ | taskService.update |
| DELETE | `/tasks/:id` | ✓ | taskService.remove |
| PATCH | `/tasks/:id/status` | ✓ | taskService.changeStatus |
| PATCH | `/tasks/:id/complete` | ✓ | taskService.markCompleted |
| PATCH | `/tasks/:id/pomodoro/increment` | ✓ | taskService.incrementPomodoro |
| POST | `/pomodoro-sessions` | ✓ | pomodoroService.create |
| GET | `/pomodoro-sessions/recent` | ✓ | pomodoroService.recent (limit 10) |
| GET | `/pomodoro-sessions/statistics` | ✓ | pomodoroService.stats |
| GET | `/dashboard/summary` | ✓ | dashboardService.summary |
| GET | `/statistics/tasks?range=7days\|30days\|month` | ✓ | statsService.tasks |
| GET | `/statistics/pomodoros?range=...` | ✓ | statsService.pomodoros |
| GET | `/settings` | ✓ | settingsService.get |
| PUT | `/settings` | ✓ | settingsService.update |
| PUT | `/settings/profile` | ✓ | settingsService.updateProfile |
| PUT | `/settings/password` | ✓ | settingsService.changePassword |
| GET | `/notifications` | ✓ | notifService.list |
| PATCH | `/notifications/:id/read` | ✓ | notifService.markRead |
| PATCH | `/notifications/read-all` | ✓ | notifService.markAllRead |

### 4.3 Auth & request flow

`authMiddleware`:
1. read `Authorization: Bearer <token>`
2. `jwt.verify(token, JWT_SECRET)`; on failure → 401
3. set `req.user = { id, email }`
4. `next()`

`validate(schema)` middleware: parses `req.body` (or `req.query`) through a zod schema; on `ZodError` → 400 with `{ error: { message, fields } }`.

### 4.4 Business logic

**Register**
1. validate body
2. check email exists → 409 Conflict
3. bcrypt.hash(password, BCRYPT_COST)
4. create User → create UserSetting default; if setting create fails, delete user (compensating)
5. sign JWT `{ id, email }`, `expiresIn = JWT_EXPIRES_IN`
6. return `{ token, user: { id, fullName, email } }`

**Login**
1. find user by lowercased email, `select('+passwordHash')`
2. `bcrypt.compare`; on fail → 401 (generic message, no leak)
3. sign JWT, return `{ token, user }`

**Task list (`GET /tasks`)**
- filter: `{ userId }`
  - `search`: `$text: { $search }`
  - `status`: equality
  - `priority`: equality
  - `deadlineFilter`:
    - `today` → `deadline ∈ [startOfDay, endOfDay]`
    - `upcoming` → `deadline > now AND status != Completed`
    - `overdue` → `deadline < now AND status != Completed`
    - `completed` → `status = Completed`
- sort:
  - `deadline` → `{ deadline: 1 }`
  - `priority` → `{ priorityRank: -1 }`
  - `newest` (default) → `{ createdAt: -1 }`
- returns tasks with virtual `isOverdue` included

**Mark completed** (`PATCH /tasks/:id/complete`)
- `findOneAndUpdate({ _id, userId })` set `status='Completed', completedAt=now`
- create `task_completed` notification (if `notificationEnabled`)

**Pomodoro create** (`POST /pomodoro-sessions`)
1. validate body
2. if `taskId` provided, verify the task belongs to `userId`; if not → 403/404
3. save session
4. if `mode='Focus' && isCompleted=true`:
   - create `pomodoro_done` notification (if `notificationEnabled`)
   - if `taskId`:
     - increment `task.completedPomodoros`
     - if `task.status === 'Todo'` → set `'InProgress'`
     - if `task.completedPomodoros >= task.estimatedPomodoros && task.status !== 'Completed'`:
       - create `estimated_reached` notification (deduped per task)

**Dashboard summary** — single endpoint returning all numbers via parallel `Promise.all`:
- totalTasks, completedTasks, inProgressTasks, overdueTasks
- todayPomodoros (Focus, isCompleted, startedAt today)
- todayFocusMinutes (sum durationMinutes of those)
- upcomingTasks (next 5 by deadline)
- recentSessions (last 5)
- completionChart (last 7 days, count of CompletedAt per day)

**Statistics**
- `parseRange(range)` → `{ start, end }`
  - `7days` → `start = today - 6d 00:00`, `end = now`
  - `30days` → `start = today - 29d 00:00`, `end = now`
  - `month` → `start = startOfMonth(now)`, `end = now`
- Tasks chart: count of tasks with `completedAt` per day in range
- Pomodoros chart: count of focus sessions with `startedAt` per day; focus minutes sum per day
- Priority pie: count tasks group-by priority (in range, by createdAt)
- Status pie: count tasks group-by status (current snapshot)

### 4.5 Cron jobs (`src/jobs/`)

In-process via `node-cron`, started after DB connect.

**overdueChecker** — every 5 min
- find tasks with `deadline < now AND status != 'Completed'`
- for each, dedup-check: no existing `task_overdue` notification for `(userId, taskId)` in last 24h
- create notifications (respecting `UserSetting.notificationEnabled`)

**deadlineSoonReminder** — every 15 min
- find tasks with `deadline ∈ (now, now + 1h] AND status != 'Completed'`
- dedup: no existing `deadline_soon` notification for the task ever
- create notifications

### 4.6 Error handling

- `asyncHandler(fn)` wraps controllers and forwards errors to `next`
- `AppError(message, statusCode)` for domain errors (404/401/403/409)
- Global error middleware:
  - `ZodError` → 400 with `{ error: { message: 'Validation failed', fields } }`
  - `AppError` → `statusCode` with `{ error: { message } }`
  - other → 500 with `{ error: { message: 'Internal server error' } }` (log full error server-side)

### 4.7 Security hygiene

- `helmet()` on the express app
- `express-rate-limit` on `/api/auth/*` (e.g. 10 requests / 15 min / IP)
- `express-mongo-sanitize` on body/query
- CORS allows only `CLIENT_ORIGIN`
- `passwordHash` always `select: false` and never returned
- JWT expiry from env (`JWT_EXPIRES_IN`, default `7d`)

### 4.8 Seed (`npm run seed[:reset]`)

1. (`:reset`) drop collections
2. create `demo@taskflow.com` / `123456`
3. create `UserSetting` defaults
4. create 8 tasks: 2 today, 2 upcoming, 1 overdue, 3 completed, mixed priorities
5. create ~20 `PomodoroSession` rows spread over the last 14 days
6. create 2-3 sample notifications (1 unread)

## 5. Frontend Design

### 5.1 Axios client

```ts
// api/axiosClient.ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api', timeout: 15000 });

api.interceptors.request.use(cfg => {
  const t = useAuthStore.getState().token;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/')) {
      useAuthStore.getState().logout();
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);
```

Vite dev: proxy `/api` → `http://localhost:4000` (no CORS friction locally).

### 5.2 React Query

```ts
// lib/queryClient.ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (n, err) => (err?.response?.status === 401 ? false : n < 2),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
```

**Query keys**
- `['auth', 'me']`
- `['tasks', filtersObj]`, `['tasks', id]`
- `['pomodoros', 'recent']`, `['pomodoros', 'stats']`
- `['dashboard']`
- `['statistics', 'tasks', range]`, `['statistics', 'pomodoros', range]`
- `['settings']`
- `['notifications']` (poll 30s while authenticated)

**Mutation invalidation map**
| Mutation | Invalidates |
|---|---|
| createTask | `['tasks']`, `['dashboard']` |
| updateTask | `['tasks']`, `['tasks', id]`, `['dashboard']` |
| deleteTask | `['tasks']`, `['dashboard']` |
| changeStatus / markCompleted | `['tasks']`, `['dashboard']`, `['statistics']` |
| createPomodoroSession | `['pomodoros', 'recent']`, `['tasks']`, `['dashboard']`, `['statistics']` |
| updateSettings | `['settings']` |
| markNotifRead / markAllRead | `['notifications']` |

Optimistic update on `markCompleted` and `deleteTask`.

### 5.3 Zustand stores

**authStore** (persisted, key `taskflow-auth`)
```ts
{ token: string|null, user: User|null,
  login(token, user), logout(), setUser(u),
  isAuthenticated: () => !!token }
```
On app mount: if token present → call `GET /auth/me`; on failure → `logout()`.

**themeStore** (persisted, key `taskflow-theme`)
```ts
{ theme: 'light'|'dark', setTheme(t), toggle() }
```
`useTheme()` toggles `class="dark"` on `<html>`. Initial source priority: persisted > settings response > `prefers-color-scheme`.

**pomodoroStore** (NOT persisted — session-only)
```ts
{
  mode: 'Focus'|'ShortBreak'|'LongBreak',
  status: 'idle'|'running'|'paused',
  durations: { focus, shortBreak, longBreak },
  endsAt: number|null,         // ms epoch
  remainingMs: number,
  startedAt: Date|null,
  selectedTaskId: string|null,
  focusCount: number,
  intervalId: number|null,
  hydrateFromSettings(s),
  setMode(m), selectTask(id|null),
  start(), pause(), reset(), skip(),
  _tick()
}
```

**Engine semantics:**
- `start()`:
  - if `idle`: `endsAt = now + durations[mode]*60_000`, `startedAt = now`, status='running', `setInterval(_tick, 250)`
  - if `paused`: `endsAt = now + remainingMs`, status='running', restart interval
- `pause()`: `remainingMs = endsAt - now`, clear interval, status='paused'
- `reset()`: clear interval, status='idle', `remainingMs = durations[mode] * 60_000`
- `skip()`: like reset but does **not** persist a session
- `_tick()`: when `now >= endsAt`, call `_complete()`
- `_complete()`:
  - clear interval
  - if `mode === 'Focus'`: call `pomodoroApi.create({ taskId, mode, durationMinutes, startedAt, endedAt: now, isCompleted: true })` via mutation hook
  - play unlocked audio + `toast.success("Pomodoro complete!")`
  - status='idle'; suggest next mode (focus 1-3 → ShortBreak; focus 4 → LongBreak); do **not** auto-start
  - if task reached estimatedPomodoros → show `EstimatedReachedModal` (Mark Complete / Keep Going)

Audio gesture-unlock: preload `Audio` at mount; first time user clicks Start, run `audio.play().then(() => audio.pause())` to satisfy autoplay policy.

### 5.4 Routing & lazy loading

```tsx
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
// ...all 7 pages

<Suspense fallback={<Loading />}>
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
</Suspense>
```

### 5.5 Tailwind theme tokens

`tailwind.config.js` extends `colors` with CSS-var-backed tokens (`bg`, `surface`, `border`, `text`, `text-muted`, `primary` palette, `priority.{low|medium|high}`, `status.{todo|progress|done|overdue}`).

`index.css`:
```css
:root { --bg: 250 250 250; --surface: 255 255 255; --border: 229 231 235; ... }
.dark { --bg: 15 23 42;   --surface: 30 41 59;   --border: 51 65 85; ... }
```
Components use `bg-bg`, `bg-surface`, `text-text`, etc., with no `dark:` prefix scattered everywhere.

### 5.6 Forms & validation

Single zod schema per form, used for both RHF resolver and TypeScript type inference. Example:
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

### 5.7 Notification polling

`useNotificationsQuery` uses `refetchInterval: 30_000` while authenticated. Bell badge shows unread count (cap "9+"). Click item → `markRead` mutation + navigate `/tasks?focus={taskId}` opening `TaskFormModal` for that task.

## 6. UI / Pages

### 6.1 AppLayout
- Sidebar (`w-64`) with sections: Dashboard, Tasks, Pomodoro, Calendar, Statistics, Settings, Logout. Active route highlighted with `bg-primary/10` and primary text/icon.
- Header (`h-16`): page title left; right side: `+ Add Task` quick button, NotificationBell, ThemeToggle, Avatar (initials) with dropdown (Logout).
- `< lg`: sidebar becomes a Drawer triggered by hamburger button.

### 6.2 Login / Register
- Single-column centered, `max-w-md`. Soft gradient background, white card.
- Login: email, password.
- Register: fullName, email, password, confirmPassword (zod refine: confirm === password).
- On success: store token + user, redirect `/dashboard`, toast.

### 6.3 Dashboard
Grid layout (responsive):
- Row 1: 4 SummaryCards (Total / Completed / In Progress / Overdue)
- Row 2: 2 wide SummaryCards (Pomodoros Today, Focus Time Today)
- Row 3 left: Today's Tasks (top 5)
- Row 3 right: Upcoming Deadlines (top 5)
- Row 4 left: Recent Pomodoros (last 5)
- Row 4 right: Mini 7-day completion BarChart
- Greeting: `Welcome back, {firstName}` + today's date

### 6.4 Tasks
- Header: title `My Tasks` + `+ Add Task`
- Filter row: search (300ms debounce), status, priority, deadline, sort, view toggle (Grid|List)
- Filter state synced with URL search params
- TaskCard (grid view): priority dot, title, 2-line description clamp, deadline, pomodoro progress `2/4`, status badge, optional Overdue badge, action buttons (Complete, Edit, Delete)
- TaskRow (list view): single-line compact with the same actions
- Optimistic delete (with confirm) + optimistic complete
- TaskFormModal (create/edit): Title, Description, Deadline (datetime-local), Priority (segmented), Estimated Pomodoros (number, default 1, min 1)

### 6.5 Pomodoro
- ModeTabs (Focus / Short Break / Long Break). Switching while running → confirm.
- ProgressRing (SVG `<circle>` + `strokeDasharray`); color per mode.
- Center: `MM:SS`, currently focused task name (or "No task").
- Controls: Reset, Start/Pause toggle, Skip.
- FocusTaskSelector below ring: dropdown of tasks with status `Todo|InProgress`, shows `2/4 🍅`.
- Today summary (sessions count, focus minutes).
- Recent sessions list (last 5–10).
- On focus completion: audio + toast + mutation + (if estimated reached) modal asking to mark complete.

### 6.6 Calendar
- `react-big-calendar` with `dateFnsLocalizer`.
- `events` mapped from tasks (start = deadline, allDay).
- `eventPropGetter` colors event by priority.
- `onSelectSlot` → set selected day → DayTasksPanel below shows tasks (TaskRow reuse).
- `onSelectEvent` → open TaskFormModal in view/edit mode.
- Tailwind override of react-big-calendar styles in `index.css` for dark theme parity.

### 6.7 Statistics
- RangeSelector (7 days | 30 days | Month).
- Grid: TaskCompletionChart (Bar), PomodoroChart (Bar), FocusMinutesChart (Line), PriorityPie, StatusPie.
- Skeletons while loading; EmptyState when ranges have no data.

### 6.8 Settings
Each section is its own RHF form with its own mutation:
- Profile: fullName editable, email read-only.
- Change Password: currentPassword, newPassword, confirmNewPassword.
- Pomodoro durations: focus / short break / long break (minutes). On save → `pomodoroStore.hydrateFromSettings()` so the engine updates immediately.
- Preferences: Theme (Light / Dark), Notifications enabled toggle.

### 6.9 Notifications
- Bell in header with unread count (cap `9+`).
- Click → popover (`w-80`) listing 10 most recent items.
- Item: type-icon, title, message, relative time (`formatDistanceToNow`), unread dot.
- Click item → `markRead`, navigate to task if `taskId` present.
- Footer: "Mark all as read".

### 6.10 Empty / Loading / Error states
| Page | Empty | Loading | Error |
|---|---|---|---|
| Tasks | "No tasks yet — click + Add Task" | Skeleton 3 cards | `Couldn't load tasks. [Retry]` |
| Pomodoro recent | "No sessions yet today" | Skeleton 3 rows | – |
| Dashboard | "Welcome! Create your first task" | Skeleton cards | Retry button |
| Calendar | calendar always renders; panel: "No tasks on this day" | Skeleton calendar | – |
| Statistics | "Not enough data" + illustration | Skeleton charts | Retry |
| Notifications | "You're all caught up" | Skeleton items | – |

### 6.11 Responsive & a11y
- Breakpoints: `< sm` mobile (single column, drawer sidebar, fullscreen modals); `sm-md` tablet (2-col); `lg+` desktop (full grid + fixed sidebar).
- Icon-only buttons have `aria-label`; modals trap focus and restore on close; form errors linked via `aria-describedby`; priority badges encode meaning with both color and icon.

## 7. Testing & Tooling

### 7.1 Backend tests (`server/tests/`)
Integration via Supertest, in-memory DB via `mongodb-memory-server`. Roughly 25 tests:
- `auth.test.js` — register, login, duplicate email, wrong password, `/me` without token
- `tasks.test.js` — CRUD; filter by status/priority/deadline; search; IDOR (user A cannot read user B's task)
- `pomodoro.test.js` — Focus session increments task counters & flips Todo→InProgress; session with another user's taskId rejected; `estimated_reached` notification dedup
- `dashboard.test.js` — summary numbers correct on small seed
- `statistics.test.js` — range parser correctness
- `settings.test.js` — update durations, change password (correct + wrong current)
- `notifications.test.js` — list, markRead, markAllRead, overdue dedup 24h

### 7.2 Frontend tests (minimal, critical only)
- `pomodoroStore.test.ts` — start → pause → resume preserves remainingMs; tick complete fires session callback
- `taskUtils.test.ts` — isOverdue, priorityRank, deadline filter
- `LoginPage.test.tsx` — invalid form shows errors; valid submit redirects

### 7.3 Lint / format / types
- Backend: ESLint (`eslint:recommended` + `n/recommended`) + Prettier
- Frontend: ESLint (`eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`, `react-refresh`) + Prettier + `prettier-plugin-tailwindcss`
- TypeScript strict (`"strict": true`, `"noUncheckedIndexedAccess": true`)

### 7.4 Environment

`server/.env.example`
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=replace-with-random-32-byte-hex
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
BCRYPT_COST=10
```
`config/env.js` validates with zod; the server fails fast if any required var is missing.

`client/.env.example`
```
VITE_API_BASE_URL=/api
```

### 7.5 npm scripts

`server`: `dev` (nodemon), `start`, `seed`, `seed:reset`, `test`, `test:watch`, `lint`, `format`
`client`: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`, `typecheck`, `format`, `test`

### 7.6 First-time run

```
1. cd server && cp .env.example .env  # fill MONGO_URI, JWT_SECRET
2. npm install
3. npm run seed:reset
4. npm run dev                        # http://localhost:4000

5. cd ../client && npm install
6. npm run dev                        # http://localhost:5173
7. login: demo@taskflow.com / 123456
```

## 8. Security Notes

- Tokens are stored in `localStorage` (per spec mục 17); this is vulnerable to XSS. Production hardening would move to httpOnly cookies + CSRF tokens. Documented in README.
- bcrypt cost `10`. Adjustable via `BCRYPT_COST`.
- Every Mongoose query in services filters by `userId`. IDOR is covered by integration tests.
- Tasks/sessions/notifications never leak across users — controllers always pass `req.user.id` into services.
- Auth routes are rate-limited to slow brute-force.
- Passwords are never returned in JSON; `passwordHash` uses `select: false`.

## 9. Acceptance Criteria (mapped from spec mục 21)

- [x] User can register / login / logout
- [x] User can create / edit / delete tasks
- [x] User can search and filter tasks
- [x] User can run the Pomodoro timer with 3 modes
- [x] Completing a Focus session persists a `PomodoroSession` and bumps task counters
- [x] Dashboard shows real numbers from the database
- [x] Statistics render real charts (Bar, Line, Pie) for 7d / 30d / month
- [x] Calendar shows tasks by deadline; clicking a day shows its tasks; clicking an event opens the task
- [x] Settings allow updating Pomodoro durations (engine reflects them immediately), profile name, password, theme, notifications toggle
- [x] No Study Together features anywhere
- [x] UI is responsive (mobile / tablet / desktop) and renders in both themes
- [x] Code runs without errors locally with the documented commands

## 10. Decisions Log (during brainstorming)

- **Backend stack:** Node.js + Express + MongoDB (per spec mục 1). Spec mục 13/19/20 (.NET / SQL Server) are explicitly discarded as a copy-paste error.
- **Repo layout:** Monorepo with `server/` and `client/` as independent npm projects (no workspaces).
- **Calendar:** `react-big-calendar` (chosen over hand-rolled).
- **Scope:** "Làm hết" — including dark theme app-wide and Notifications module. Forgot-password is **dropped** (per user decision).
- **Notification triggers:** task overdue, task completed, pomodoro session done, deadline within 1h, plus `estimated_reached` (covered by per-task dedup logic).
- **Server state:** React Query added (spec only mentioned client state libs).
- **Pomodoro engine:** `endsAt`-based timing (avoids drift when tab is throttled).
- **Mongoose:** compound indexes + text index + virtual `isOverdue`.
- **Security hygiene:** helmet + rate limit on auth + mongo-sanitize.
- **Frontend perf:** route-level code splitting via `React.lazy`.
- **Audio:** preload + gesture-unlock on first Start click.
- **Token storage:** `localStorage` per spec, with the trade-off documented in README.
- **Enums:** stored as strings in Mongo (not the int codes from spec mục 11) for self-describing JSON. Priority gets a `priorityRank` field for index-friendly sort.

## 11. Out of Scope (final list)

- Study Together (entire feature surface)
- Realtime chat / video / WebSocket study rooms
- Forgot-password flow
- E2E browser tests, Docker, deployment automation
- i18n, file upload, avatars, recurring tasks, subtasks, tags, projects

---

**Next step:** invoke `superpowers:writing-plans` to produce the detailed implementation plan.
