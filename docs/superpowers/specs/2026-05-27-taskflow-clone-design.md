# Task88 Clone — Design Spec

**Date:** 2026-05-27
**Status:** Approved (brainstorming complete)
**Reference:** Inspired by https://www.Task88.pro.vn/ — productivity app with tasks, pomodoro, calendar, stats. Study Together explicitly excluded.

---

## 1. Goals & Non-Goals

### Goals

A productivity web app where an authenticated user can:

- Manage tasks (CRUD, filter, search, sort, mark complete)
- Run a Pomodoro timer (focus / short break / long break) tied to tasks
- View tasks on a monthly/weekly calendar by deadline
- See dashboard summary and statistics charts
- Configure profile, password, pomodoro durations, theme, notifications
- Receive in-app notifications (overdue, completion, deadline-soon, pomodoro done, estimated reached)

### Non-Goals (explicitly out of scope)

- Study Together (all related features)
- Realtime chat, video call, WebSocket/SSE study rooms
- Forgot password / email reset
- E2E browser tests
- Docker compose, deployment scripts, CI/CD
- i18n (UI is English-only)
- File upload, avatar images
- Recurring tasks, subtasks, tags, projects, multi-user collaboration

---

## 2. Tech Stack (final, decided during brainstorm)

### Backend

- **Node.js 20+** + **Express**
- **MongoDB 6+** via **Mongoose**
- **JWT** authentication (jsonwebtoken), **bcrypt** for password hashing
- **zod** for request validation
- **node-cron** for scheduled jobs
- **helmet**, **express-rate-limit**, **express-mongo-sanitize** for security hygiene
- **Jest** + **Supertest** + **mongodb-memory-server** for tests

### Frontend

- **React 18** + **Vite** + **TypeScript** (strict)
- **Tailwind CSS** (CSS-vars-based theming, `class` dark mode strategy)
- **React Router DOM v6**
- **Axios** with interceptors
- **@tanstack/react-query** for server state
- **Zustand** for client-only state (auth, theme, pomodoro engine)
- **React Hook Form** + **Zod** + **@hookform/resolvers** for forms
- **Recharts** for charts
- **react-big-calendar** + **date-fns** for calendar
- **sonner** for toasts
- **lucide-react** for icons
- **Vitest** + **@testing-library/react** for tests

### Repo Layout

Monorepo with **two independent `package.json` files** (no workspaces):

```
web_itss_demo/
├── README.md
├── .gitignore
├── docs/superpowers/specs/2026-05-27-Task88-clone-design.md
├── server/
└── client/
```

---

## 3. Architecture Overview

### 3.1 High-level

```
┌──────────────┐      HTTP/JSON       ┌──────────────┐      Mongoose      ┌─────────────┐
│  React SPA   │ ───────────────────▶ │ Express API  │ ─────────────────▶ │  MongoDB    │
│  (Vite dev   │ ◀─────────────────── │ (JWT-guarded)│ ◀───────────────── │             │
│   proxy /api)│   Bearer token       │              │                    │             │
└──────────────┘                      └──────┬───────┘                    └─────────────┘
                                             │
                                       ┌─────▼─────┐
                                       │ Cron jobs │
                                       │  in-proc  │
                                       └───────────┘
```

### 3.2 Backend boundaries

- **Controller** — thin HTTP layer: extract `req.body`, `req.user.id`, `req.query`; delegate to service; return JSON.
- **Service** — pure business logic. Receives `userId` as first arg. Does **not** import express types.
- **Model (Mongoose)** — schema, indexes, virtuals. Contains validation defaults but no business rules.
- **Middleware** — `authMiddleware` (JWT verify), `validate(schema)` (zod), `errorHandler` (last).
- **Validators** — zod schemas per route.
- **Jobs** — pure functions invoked by node-cron schedulers. Testable standalone.

**IDOR rule:** every Mongoose query filtering user-owned documents MUST include `userId: req.user.id`. No exceptions. Tests enforce this for every resource.

### 3.3 Frontend boundaries

- **Pages** — route entry, fetch via React Query hooks, compose components.
- **Components** — presentational, receive props. Common primitives in `components/common/`.
- **Hooks/queries** — React Query wrappers per resource (`useTaskQueries.ts`, etc.). One file per resource exports both queries and mutations.
- **Stores** — Zustand stores for client-only state (`authStore`, `themeStore`, `pomodoroStore`).
- **API layer** — axios + per-resource API modules. Stores never fetch directly; pages/hooks fetch via React Query.

### 3.4 Pomodoro engine — runs in Zustand store

Critical design decision: timer state lives in `pomodoroStore`, not in a component. Reasons:

- Timer survives route changes
- One source of truth for current mode/task/status
- Browser tab throttling does not drift the timer because we use **`endsAt` timestamp**, not tick counter

When tab is inactive, Chrome throttles `setInterval` to ~1/min. By computing `remaining = endsAt - Date.now()` on each tick, the displayed time is always correct regardless of tick rate.

---

## 4. Folder Structure

### 4.1 `server/`

```
server/
├── package.json
├── .env.example
├── jest.config.js
├── src/
│   ├── index.js                # entry: load env, connect db, start cron, listen
│   ├── app.js                  # express app: helmet, cors, json, mongo-sanitize, routes, errorHandler
│   ├── config/
│   │   ├── env.js              # zod-validated env loader
│   │   └── db.js               # mongoose.connect with retry
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── PomodoroSession.js
│   │   ├── UserSetting.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── index.js            # mounts /auth, /tasks, etc.
│   │   ├── auth.routes.js
│   │   ├── task.routes.js
│   │   ├── pomodoro.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── statistics.routes.js
│   │   ├── settings.routes.js
│   │   └── notification.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── task.controller.js
│   │   ├── pomodoro.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── statistics.controller.js
│   │   ├── settings.controller.js
│   │   └── notification.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── jwt.service.js
│   │   ├── task.service.js
│   │   ├── pomodoro.service.js
│   │   ├── dashboard.service.js
│   │   ├── statistics.service.js
│   │   ├── settings.service.js
│   │   └── notification.service.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── error.middleware.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── task.validator.js
│   │   ├── pomodoro.validator.js
│   │   ├── settings.validator.js
│   │   └── common.validator.js  # objectId, dateRange
│   ├── utils/
│   │   ├── passwordHasher.js
│   │   ├── asyncHandler.js
│   │   ├── AppError.js
│   │   ├── dateRange.js
│   │   └── priorityRank.js
│   ├── jobs/
│   │   ├── index.js            # registers all cron jobs
│   │   ├── overdueChecker.js
│   │   └── deadlineSoonReminder.js
│   └── seed/
│       └── seed.js
└── tests/
    ├── setup.js
    ├── helpers/
    │   └── createAuthedAgent.js
    ├── auth.test.js
    ├── tasks.test.js
    ├── pomodoro.test.js
    ├── dashboard.test.js
    ├── statistics.test.js
    ├── settings.test.js
    └── notifications.test.js
```

### 4.2 `client/`

```
client/
├── package.json
├── vite.config.ts              # proxy /api → http://localhost:4000
├── tailwind.config.js          # darkMode: 'class', custom tokens via CSS vars
├── postcss.config.js
├── tsconfig.json
├── index.html                  # Inter via Google Fonts
├── .env.example                # VITE_API_BASE_URL=/api
└── src/
    ├── main.tsx                # ReactDOM.createRoot, providers
    ├── App.tsx                 # Toaster + Router
    ├── index.css               # Tailwind layers + theme CSS vars
    ├── api/
    │   ├── axiosClient.ts
    │   ├── authApi.ts
    │   ├── taskApi.ts
    │   ├── pomodoroApi.ts
    │   ├── dashboardApi.ts
    │   ├── statisticsApi.ts
    │   ├── settingsApi.ts
    │   └── notificationApi.ts
    ├── routes/
    │   ├── AppRouter.tsx
    │   ├── ProtectedRoute.tsx
    │   └── PublicOnlyRoute.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── DashboardPage.tsx
    │   ├── TasksPage.tsx
    │   ├── PomodoroPage.tsx
    │   ├── CalendarPage.tsx
    │   ├── StatisticsPage.tsx
    │   ├── SettingsPage.tsx
    │   └── NotFoundPage.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   ├── ThemeToggle.tsx
    │   │   └── NotificationBell.tsx
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Textarea.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Drawer.tsx
    │   │   ├── Card.tsx
    │   │   ├── Badge.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── Loading.tsx
    │   │   ├── ErrorState.tsx
    │   │   └── ConfirmDialog.tsx
    │   ├── tasks/
    │   │   ├── TaskCard.tsx
    │   │   ├── TaskRow.tsx
    │   │   ├── TaskList.tsx
    │   │   ├── TaskFormModal.tsx
    │   │   ├── TaskFilters.tsx
    │   │   ├── TaskStatusBadge.tsx
    │   │   ├── TaskPriorityBadge.tsx
    │   │   └── TaskQuickAddButton.tsx
    │   ├── pomodoro/
    │   │   ├── PomodoroTimer.tsx
    │   │   ├── PomodoroModeTabs.tsx
    │   │   ├── FocusTaskSelector.tsx
    │   │   ├── PomodoroHistoryList.tsx
    │   │   └── ProgressRing.tsx
    │   ├── dashboard/
    │   │   ├── SummaryCard.tsx
    │   │   ├── TodayTasks.tsx
    │   │   ├── UpcomingTasks.tsx
    │   │   ├── RecentPomodoros.tsx
    │   │   └── CompletionMiniChart.tsx
    │   ├── calendar/
    │   │   ├── CalendarView.tsx
    │   │   └── DayTasksPanel.tsx
    │   ├── statistics/
    │   │   ├── RangeSelector.tsx
    │   │   ├── TaskCompletionChart.tsx
    │   │   ├── PomodoroChart.tsx
    │   │   ├── FocusMinutesChart.tsx
    │   │   ├── PriorityPie.tsx
    │   │   └── StatusPie.tsx
    │   └── notifications/
    │       ├── NotificationPanel.tsx
    │       └── NotificationItem.tsx
    ├── hooks/
    │   ├── queries/
    │   │   ├── useAuthQueries.ts
    │   │   ├── useTaskQueries.ts
    │   │   ├── usePomodoroQueries.ts
    │   │   ├── useDashboardQuery.ts
    │   │   ├── useStatisticsQueries.ts
    │   │   ├── useSettingsQueries.ts
    │   │   └── useNotificationQueries.ts
    │   ├── useAuth.ts
    │   ├── useDebounce.ts
    │   ├── useTheme.ts
    │   └── usePomodoroEngine.ts
    ├── store/
    │   ├── authStore.ts
    │   ├── themeStore.ts
    │   └── pomodoroStore.ts
    ├── types/
    │   ├── auth.ts
    │   ├── task.ts
    │   ├── pomodoro.ts
    │   ├── statistics.ts
    │   ├── settings.ts
    │   └── notification.ts
    ├── utils/
    │   ├── dateUtils.ts
    │   ├── taskUtils.ts
    │   └── formatters.ts
    ├── lib/
    │   ├── queryClient.ts
    │   └── audio.ts
    └── validators/
        ├── auth.schema.ts
        ├── task.schema.ts
        └── settings.schema.ts
```

---

## 5. Data Model

### 5.1 Conventions

- IDs: MongoDB `ObjectId` (rendered as `_id` in JSON; spec mentions Guid but Mongo native is ObjectId).
- Enums stored as **strings** (not ints), matching the values used in API: `'Low'|'Medium'|'High'`, `'Todo'|'InProgress'|'Completed'`, `'Focus'|'ShortBreak'|'LongBreak'`. Frontend never needs a lookup table.
- All timestamps via Mongoose `timestamps: true` where applicable (`createdAt`, `updatedAt`).
- All schemas configure `toJSON: { virtuals: true, versionKey: false, transform: (_, ret) => { delete ret.passwordHash; return ret; } }`.

### 5.2 Schemas

#### User

```js
{
  _id: ObjectId,
  fullName: String (required, trim, 1..100),
  email: String (required, unique, lowercase, indexed, validate email),
  passwordHash: String (required, select: false),
  createdAt, updatedAt
}
```

#### Task

```js
{
  _id: ObjectId,
  userId: ObjectId (ref User, indexed, required),
  title: String (required, trim, 1..200),
  description: String (optional, max 2000),
  deadline: Date (required),
  priority: String enum ['Low','Medium','High'] (required),
  priorityRank: Number (1|2|3, auto-set on save based on priority — for sort indexes),
  status: String enum ['Todo','InProgress','Completed'] (default 'Todo'),
  estimatedPomodoros: Number (min 1, default 1),
  completedPomodoros: Number (default 0, min 0),
  completedAt: Date (optional),
  createdAt, updatedAt
}
// virtual: isOverdue → deadline < now && status !== 'Completed'
// indexes:
//   { userId: 1, deadline: 1 }
//   { userId: 1, status: 1 }
//   { userId: 1, priorityRank: -1 }
//   text index on (title, description) for search
// pre('save'): syncs priorityRank from priority
```

#### PomodoroSession

```js
{
  _id: ObjectId,
  userId: ObjectId (indexed, required),
  taskId: ObjectId (ref Task, optional),
  mode: String enum ['Focus','ShortBreak','LongBreak'] (required),
  durationMinutes: Number (required, min 1),
  startedAt: Date (required),
  endedAt: Date (optional),
  isCompleted: Boolean (default false),
  createdAt, updatedAt
}
// indexes:
//   { userId: 1, startedAt: -1 }
//   { taskId: 1, isCompleted: 1 }
```

#### UserSetting (1-1 with User; created in same transaction as register)

```js
{
  _id: ObjectId,
  userId: ObjectId (unique, indexed, required),
  focusDuration: Number (default 25, min 1, max 120),
  shortBreakDuration: Number (default 5, min 1, max 60),
  longBreakDuration: Number (default 15, min 1, max 60),
  theme: String enum ['light','dark'] (default 'light'),
  notificationEnabled: Boolean (default true),
  createdAt, updatedAt
}
```

#### Notification

```js
{
  _id: ObjectId,
  userId: ObjectId (indexed, required),
  title: String (required),
  message: String (required),
  type: String enum [
    'task_overdue',
    'task_completed',
    'pomodoro_done',
    'deadline_soon',
    'estimated_reached'
  ],
  taskId: ObjectId (ref Task, sparse, optional),
  isRead: Boolean (default false),
  createdAt
}
// indexes:
//   { userId: 1, isRead: 1, createdAt: -1 }
//   { userId: 1, type: 1, taskId: 1, createdAt: -1 }  // dedup lookup
```

### 5.3 Relationships

- User 1—N Task
- User 1—N PomodoroSession; Task 1—N PomodoroSession
- User 1—1 UserSetting
- User 1—N Notification

---

## 6. API Surface

All routes under `/api`. All non-auth routes require `Authorization: Bearer <jwt>`.

| Method | Path                            | Body / Query                                                                          | Response                    | Service                        |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- | ------------------------------ |
| POST   | `/auth/register`                | `{fullName,email,password,confirmPassword}`                                           | `{token,user}`              | authService.register           |
| POST   | `/auth/login`                   | `{email,password}`                                                                    | `{token,user}`              | authService.login              |
| GET    | `/auth/me`                      | –                                                                                     | `{user}`                    | authService.me                 |
| GET    | `/tasks`                        | `?search&status&priority&deadlineFilter&sortBy`                                       | `Task[]` (with `isOverdue`) | taskService.list               |
| GET    | `/tasks/:id`                    | –                                                                                     | `Task`                      | taskService.get                |
| POST   | `/tasks`                        | `{title,description?,deadline,priority,estimatedPomodoros}`                           | `Task`                      | taskService.create             |
| PUT    | `/tasks/:id`                    | same as POST                                                                          | `Task`                      | taskService.update             |
| DELETE | `/tasks/:id`                    | –                                                                                     | `{ok:true}`                 | taskService.remove             |
| PATCH  | `/tasks/:id/status`             | `{status}`                                                                            | `Task`                      | taskService.changeStatus       |
| PATCH  | `/tasks/:id/complete`           | –                                                                                     | `Task`                      | taskService.markCompleted      |
| PATCH  | `/tasks/:id/pomodoro/increment` | –                                                                                     | `Task`                      | taskService.incrementPomodoro  |
| POST   | `/pomodoro-sessions`            | `{taskId?,mode,durationMinutes,startedAt,endedAt,isCompleted}`                        | `Session`                   | pomodoroService.create         |
| GET    | `/pomodoro-sessions/recent`     | `?limit=10`                                                                           | `Session[]`                 | pomodoroService.recent         |
| GET    | `/pomodoro-sessions/statistics` | `?range`                                                                              | `{...}`                     | pomodoroService.stats          |
| GET    | `/dashboard/summary`            | –                                                                                     | summary object (see 6.2)    | dashboardService.summary       |
| GET    | `/statistics/tasks`             | `?range=7days\|30days\|month`                                                         | series array                | statsService.tasks             |
| GET    | `/statistics/pomodoros`         | `?range=...`                                                                          | series array                | statsService.pomodoros         |
| GET    | `/settings`                     | –                                                                                     | `Setting`                   | settingsService.get            |
| PUT    | `/settings`                     | `{focusDuration?,shortBreakDuration?,longBreakDuration?,theme?,notificationEnabled?}` | `Setting`                   | settingsService.update         |
| PUT    | `/settings/profile`             | `{fullName}`                                                                          | `User`                      | settingsService.updateProfile  |
| PUT    | `/settings/password`            | `{currentPassword,newPassword,confirmPassword}`                                       | `{ok:true}`                 | settingsService.changePassword |
| GET    | `/notifications`                | `?limit=20`                                                                           | `Notification[]`            | notifService.list              |
| PATCH  | `/notifications/:id/read`       | –                                                                                     | `Notification`              | notifService.markRead          |
| PATCH  | `/notifications/read-all`       | –                                                                                     | `{count}`                   | notifService.markAllRead       |

### 6.1 Query semantics for `GET /tasks`

```
filter = { userId }
if search:   filter.$text = { $search: search }
if status:   filter.status = status
if priority: filter.priority = priority

deadlineFilter:
  today      → deadline ∈ [startOfDay(now), endOfDay(now)]
  upcoming   → deadline > now AND status != 'Completed'
  overdue    → deadline < now AND status != 'Completed'
  completed  → status = 'Completed'

sortBy:
  deadline (default) → { deadline: 1 }
  priority           → { priorityRank: -1, deadline: 1 }
  newest             → { createdAt: -1 }
```

### 6.2 `GET /dashboard/summary` shape

```json
{
  "totalTasks": 12,
  "completedTasks": 5,
  "inProgressTasks": 4,
  "overdueTasks": 1,
  "todayPomodoros": 3,
  "todayFocusMinutes": 75,
  "upcomingTasks": [/* 5 next tasks */],
  "todayTasks":    [/* tasks with deadline today */],
  "recentSessions":[/* last 5 sessions */],
  "completionChart":[
    { "date": "2026-05-21", "count": 1 },
    ...
    { "date": "2026-05-27", "count": 3 }
  ]
}
```

### 6.3 Statistics shapes

```
GET /statistics/tasks?range=7days
→ [{ date: 'YYYY-MM-DD', count: number }]   // by completedAt

GET /statistics/pomodoros?range=30days
→ {
    daily: [{ date, sessions, focusMinutes }],
    byPriority: [{ priority: 'Low'|'Medium'|'High', count }],
    byStatus:   [{ status, count }]
  }
```

### 6.4 Error response shape

All errors:

```json
{
  "error": {
    "message": "human readable",
    "code": "OPTIONAL_CODE",
    "fields": { "fieldName": "msg" }
  }
}
```

Status codes: 400 (validation), 401 (no/invalid token), 403 (forbidden), 404 (not found, also for IDOR — never leak existence), 409 (conflict, e.g. duplicate email), 429 (rate limit), 500.

---

## 7. Business Logic

### 7.1 Auth

**Register:**

1. Validate `{fullName, email, password, confirmPassword}` (zod).
2. Lowercase email; if exists → 409.
3. Hash password with bcrypt (cost from `BCRYPT_COST` env, default 10).
4. Create `User`. Then create `UserSetting` with defaults. If setting creation fails, delete the user (compensating action — Mongo standalone has no multi-doc transactions guaranteed without replica set).
5. Sign JWT `{ id, email }`, expires `JWT_EXPIRES_IN` (default `7d`).
6. Respond `{ token, user: {id, fullName, email} }`.

**Login:**

1. Find user by lowercase email, `select('+passwordHash')`.
2. `bcrypt.compare`. Wrong → 401 generic "Invalid credentials".
3. Sign JWT and respond.

**`/auth/me`:** Return `req.user` populated from token + fresh DB lookup (in case fullName changed).

**Rate limit:** `/auth/register` and `/auth/login` — max 10 req/min per IP.

### 7.2 Tasks

**Create:** insert with `userId = req.user.id`. `priorityRank` auto-set in pre-save hook.

**Update:** `findOneAndUpdate({ _id, userId }, body, { new: true, runValidators: true })`. If null → 404.

**Delete:** `findOneAndDelete({ _id, userId })`. Also delete linked PomodoroSessions? **No** — keep historical data; sessions can have null taskId logically, but we keep `taskId` reference (orphan acceptable, queries that join check existence).

**ChangeStatus:** validates status enum; if becoming `'Completed'`, also set `completedAt = now` and create notification `task_completed`.

**MarkCompleted:** alias of changeStatus to `'Completed'`. Idempotent (no double-notification — check current status first).

**IncrementPomodoro:** `$inc: { completedPomodoros: 1 }`. If task was `'Todo'`, set to `'InProgress'`. If `completedPomodoros >= estimatedPomodoros` AND status not Completed AND no prior `estimated_reached` notification for this task → create one.

### 7.3 Pomodoro session

**Create:**

1. Validate body.
2. If `taskId`: verify `Task.findOne({ _id: taskId, userId })` — else 403.
3. Save session.
4. If `mode === 'Focus' && isCompleted === true`:
   a. Create notification `pomodoro_done` (title "Focus session complete", message includes duration and task title if any).
   b. If `taskId`: call taskService.incrementPomodoro internally.
5. Return session.

**Recent:** `find({ userId }).sort({ startedAt: -1 }).limit(10)`.

**Stats:** today summary used by dashboard.

### 7.4 Dashboard summary

Single endpoint, computed via `Promise.all` of independent queries:

- counts by status (filter on `userId`)
- overdueTasks: `count({ userId, deadline: { $lt: now }, status: { $ne: 'Completed' } })`
- todayPomodoros: `count({ userId, mode: 'Focus', isCompleted: true, startedAt: { $gte: startOfToday } })`
- todayFocusMinutes: aggregate `$sum: '$durationMinutes'` over today's completed Focus sessions
- upcomingTasks: top 5 by `deadline > now AND status != 'Completed'`, sorted asc
- todayTasks: deadline within today, status != Completed
- recentSessions: 5 most recent
- completionChart: last 7 days, aggregate `count tasks with completedAt in [day, day+1)`, fill zeros for missing days

### 7.5 Statistics

`parseRange(range)`:

- `7days` → `{ start: startOfDay(today - 6d), end: now }`
- `30days` → `{ start: startOfDay(today - 29d), end: now }`
- `month` → `{ start: startOfMonth(now), end: now }`

**Tasks completion series** — group `completedAt` by day, count, fill missing days with 0.

**Pomodoros series** — group `startedAt` (Focus + isCompleted) by day; produce `sessions` count and `focusMinutes` sum.

**byPriority/byStatus** — aggregate over all user tasks (not range-bound) for pie charts (small, snapshot view).

### 7.6 Settings

**update**: only allow declared fields; reject unknown.

**updateProfile**: only `fullName` editable. Email is immutable in this MVP.

**changePassword**:

1. Validate `{currentPassword, newPassword, confirmPassword}`.
2. Re-fetch user with `+passwordHash`.
3. `bcrypt.compare(currentPassword, hash)`; wrong → 401.
4. Hash newPassword, save.

### 7.7 Notifications

Created by:

- `task_overdue` — cron job `overdueChecker` every 5 minutes
- `deadline_soon` — cron job `deadlineSoonReminder` every 15 minutes (deadline within next 1h)
- `task_completed` — service when status transitions to Completed
- `pomodoro_done` — service when Focus session completes
- `estimated_reached` — service when `completedPomodoros >= estimatedPomodoros` (once per task)

**Dedup rule:** for cron-driven types (`task_overdue`, `deadline_soon`), before creating, check `Notification.findOne({ userId, type, taskId, createdAt: { $gt: now - 24h for overdue, > now - 2h for deadline_soon } })`. Skip if exists.

**Respect `UserSetting.notificationEnabled`** — skip creation when false.

### 7.8 IDOR enforcement

Every `findOne`, `findOneAndUpdate`, `findOneAndDelete`, `find`, `aggregate` over user-owned collections includes `userId: req.user.id`. Never trust `req.params.id` alone.

Tests: for each resource, an explicit cross-user test creates user A's resource and verifies user B gets 404 (not 403, to avoid leaking existence).

---

## 8. Frontend Architecture

### 8.1 Bootstrapping (`main.tsx` + `App.tsx`)

`main.tsx`:

- Create QueryClient (config below)
- Wrap `<QueryClientProvider>`, `<BrowserRouter>`, `<App/>`

`App.tsx`:

- `useTheme()` mounts theme effect (apply `dark` class to `<html>`)
- `<Toaster />` from sonner (top-right, light/dark adaptive)
- `<AppRouter />`
- `<ReactQueryDevtools initialIsOpen={false} />` (dev only)

### 8.2 React Query config (`lib/queryClient.ts`)

```ts
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

### 8.3 Query keys

```
['auth', 'me']
['tasks', filters]                  // filters object stringified by RQ
['tasks', id]
['pomodoros', 'recent']
['pomodoros', 'stats']
['dashboard']
['statistics', 'tasks', range]
['statistics', 'pomodoros', range]
['settings']
['notifications']                   // refetchInterval 30s
```

### 8.4 Mutation invalidation map

| Mutation                     | Invalidates                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| login / register             | sets auth state, prefetches `['auth','me']`                                                   |
| logout                       | resets QueryClient cache                                                                      |
| createTask                   | `['tasks']`, `['dashboard']`                                                                  |
| updateTask                   | `['tasks']`, `['tasks', id]`, `['dashboard']`                                                 |
| deleteTask                   | `['tasks']`, `['dashboard']` (optimistic)                                                     |
| changeStatus / markCompleted | `['tasks']`, `['dashboard']`, `['statistics']`                                                |
| incrementPomodoro            | `['tasks']`, `['dashboard']`                                                                  |
| createPomodoroSession        | `['pomodoros','recent']`, `['tasks']`, `['dashboard']`, `['statistics']`, `['notifications']` |
| updateSettings               | `['settings']`                                                                                |
| updateProfile                | `['auth','me']`, `['settings']`                                                               |
| changePassword               | none                                                                                          |
| markNotifRead / markAllRead  | `['notifications']`                                                                           |

### 8.5 Stores

**`authStore`** (Zustand + persist key `Task88-auth`, localStorage):

```ts
{
  token: string | null,
  user: { id, fullName, email } | null,
  login(token, user) { set both, persist },
  logout() { clear, queryClient.clear() },
  setUser(u) { set user only },
  isAuthenticated() => !!token
}
```

Hydration: on App mount, if `token` exists, fire `useAuthQueries.useMe()` once; on 401, logout.

**`themeStore`** (persist key `Task88-theme`):

```ts
{
  theme: ('light' | 'dark', setTheme(t), toggle());
}
```

`useTheme()` effect: applies/removes `dark` class on `<html>`. Initial value: persisted > settings.theme (after auth) > `prefers-color-scheme`.

**`pomodoroStore`** (NOT persisted, session-only):

```ts
{
  mode: 'Focus'|'ShortBreak'|'LongBreak',
  status: 'idle'|'running'|'paused',
  durations: { focus: number, shortBreak: number, longBreak: number },  // minutes
  endsAt: number | null,
  remainingMs: number,
  startedAt: Date | null,
  selectedTaskId: string | null,
  intervalId: number | null,
  focusCount: number,           // count of focus sessions completed in current cycle (resets after long break)

  hydrateFromSettings(s),
  setMode(m),
  selectTask(id | null),
  start(),
  pause(),
  reset(),
  skip(),
  _tick(),                      // private, runs every 250ms
  _complete()                   // private, fires when timer reaches 0
}
```

**Engine state machine:**

```
       start()
idle ─────────────▶ running
  ▲                   │ ─── tick reaches 0 ──▶ _complete() ──▶ idle
  │                   │
  │  reset()/skip()   │ pause()
  │ ◀─────────────────┤
  │                   ▼
  └─── reset() ──── paused
                       │
                       │ start() (resume)
                       ▼
                    running
```

**`start()`:**

- If `idle`: `endsAt = Date.now() + durations[mode] * 60_000`; `startedAt = mode === 'Focus' ? new Date() : startedAt`; `status = 'running'`; `intervalId = setInterval(_tick, 250)`.
- If `paused`: `endsAt = Date.now() + remainingMs`; `status = 'running'`; resume interval.

**`pause()`:** `remainingMs = endsAt - Date.now()`; `clearInterval(intervalId)`; `status = 'paused'`.

**`reset()`:** `clearInterval`; `status = 'idle'`; `remainingMs = durations[mode] * 60_000`; `endsAt = null`.

**`skip()`:** like reset but no session is recorded (interpretation: user skipped without completing). Auto-suggest next mode.

**`_tick()`:** if `now >= endsAt` → `_complete()`. Otherwise notify subscribers (component reads `endsAt` and computes display).

**`_complete()`:**

- `clearInterval`
- If `mode === 'Focus'`:
  - `focusCount += 1`
  - Call `pomodoroApi.create({ taskId: selectedTaskId, mode: 'Focus', durationMinutes: durations.focus, startedAt, endedAt: new Date(), isCompleted: true })` directly via axios; on success, call `queryClient.invalidateQueries` for `['pomodoros','recent']`, `['tasks']`, `['dashboard']`, `['statistics']`, `['notifications']`. (Stores cannot use React hooks; they use the imported `queryClient` from `lib/queryClient.ts` and `pomodoroApi` directly.)
  - Auto-suggest: `focusCount % 4 === 0` → `setMode('LongBreak')` else `setMode('ShortBreak')`
- Else (break completes):
  - Save the break session too (`isCompleted: true`) so history is complete.
  - Auto-suggest: `setMode('Focus')`
- Play audio (`lib/audio.ts`)
- Emit toast "Time's up!"
- Set `status = 'idle'`, `remainingMs = durations[nextMode] * 60_000`

**`hydrateFromSettings({ focusDuration, shortBreakDuration, longBreakDuration })`:** Update `durations`. If `status === 'idle'`, also recompute `remainingMs` for current mode.

### 8.6 Routing (`routes/AppRouter.tsx`)

All page modules are `lazy(() => import(...))`. Wrap entire `<Routes>` in `<Suspense fallback={<Loading />}>`.

```
public-only:
  /login, /register

protected (wrapped in <AppLayout>):
  /dashboard, /tasks, /pomodoro, /calendar, /statistics, /settings

other:
  /          → redirect /dashboard
  *          → NotFoundPage
```

### 8.7 Forms

Single zod schema source per form:

```ts
// validators/task.schema.ts
export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(2000).optional().or(z.literal('')),
  deadline: z.coerce.date(),
  priority: z.enum(['Low', 'Medium', 'High']),
  estimatedPomodoros: z.coerce.number().int().min(1, 'At least 1'),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
```

`useForm({ resolver: zodResolver(taskFormSchema), defaultValues })`.

### 8.8 Tailwind theme tokens

```js
// tailwind.config.js
darkMode: 'class',
theme: {
  extend: {
    colors: {
      bg:      'rgb(var(--bg) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      border:  'rgb(var(--border) / <alpha-value>)',
      text:    {
        DEFAULT: 'rgb(var(--text))',
        muted:   'rgb(var(--text-muted))',
      },
      primary: { 50:'#eef2ff', 100:'#e0e7ff', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca' },
      priority: { low:'#16a34a', medium:'#f59e0b', high:'#dc2626' },
      status:   { todo:'#64748b', progress:'#2563eb', done:'#16a34a', overdue:'#dc2626' },
    },
    borderRadius: { '2xl':'16px', '3xl':'20px' },
  },
},
```

```css
/* index.css */
:root {
  --bg: 250 250 250;
  --surface: 255 255 255;
  --border: 229 231 235;
  --text: 15 23 42;
  --text-muted: 100 116 139;
}
.dark {
  --bg: 15 23 42;
  --surface: 30 41 59;
  --border: 51 65 85;
  --text: 241 245 249;
  --text-muted: 148 163 184;
}
```

Components use `bg-bg`, `bg-surface`, `text-text`, `text-text-muted`, `border-border` — no `dark:` prefixes scattered through the codebase.

### 8.9 Notifications polling

`useNotificationQueries.useList()`:

```ts
useQuery({
  queryKey: ['notifications'],
  queryFn: notificationApi.list,
  refetchInterval: 30_000,
  enabled: useAuthStore((s) => !!s.token),
});
```

`<NotificationBell>` reads list, computes unread count (cap at "9+"), opens popover. Click item → markRead + (if `taskId`) navigate `/tasks?focus=${taskId}` and TasksPage opens TaskFormModal in view/edit mode for that ID.

---

## 9. UI Pages

### 9.1 AppLayout

Sidebar (left, 256px on `lg`, drawer on `<lg`):

- Logo "Task88"
- Nav items: Dashboard, Tasks, Pomodoro, Calendar, Statistics, Settings
- Bottom: Logout button
- Active route highlighted (`bg-primary-50 dark:bg-primary-500/10` + `text-primary-600`)

Header (top, h-16):

- Page title (derived from current route)
- Quick "+ Add Task" button → opens TaskFormModal (create) with deadline pre-filled to end-of-today
- Notification bell with badge
- Theme toggle (sun/moon)
- Avatar with initials → menu (Settings, Logout)

### 9.2 LoginPage / RegisterPage

Centered card on gradient background (`bg-gradient-to-br from-primary-50 to-bg`).

**LoginPage form:**

- Email (input)
- Password (input type=password)
- Submit "Log in"
- Link to `/register`

**RegisterPage form:**

- Full name
- Email
- Password
- Confirm password
- Submit "Create account"
- Link to `/login`

Validation messages in English. On success → `authStore.login` → `navigate('/dashboard')` → toast "Welcome back".

### 9.3 DashboardPage

Greeting `Welcome back, {firstName}` + today's date.

Layout grid (responsive):

- Row 1: 4 SummaryCard (Total / Completed / In Progress / Overdue)
- Row 2: 2 wide SummaryCard (Pomodoros today / Focus minutes today)
- Row 3: TodayTasks (left) + UpcomingTasks (right)
- Row 4: RecentPomodoros (left) + CompletionMiniChart (right, 7 days BarChart 120px height)

Click any task row → opens TaskFormModal (view/edit). Empty states for each section.

### 9.4 TasksPage

Header:

- Title "My Tasks"
- "+ Add Task" button

Toolbar (sticky):

- Search input (debounced 300ms)
- Status select (All / Todo / In Progress / Completed)
- Priority select (All / Low / Medium / High)
- Deadline filter select (All / Today / Upcoming / Overdue / Completed)
- Sort select (Deadline / Priority / Newest)
- View toggle (Grid / List)

Filter state syncs to URL query params. Hard refresh preserves filter.

**TaskCard (grid):**

- Priority dot + Title (truncate) + ⋮ menu
- Description 2-line clamp
- Bottom row: 🕐 deadline · ⏱ `{completed}/{estimated}` · status badge · overdue badge if applicable
- Action row: ✓ Complete · Edit · Delete (Delete fires ConfirmDialog)

**TaskRow (list):** compact single row.

Optimistic updates: mark complete and delete update UI before server confirms; rollback on error.

**TaskFormModal:** Modal on desktop, Drawer on mobile.
Fields: Title*, Description (textarea), Deadline* (datetime-local), Priority* (segmented Low/Medium/High), Estimated Pomodoros* (number).

### 9.5 PomodoroPage

Top: mode tabs (Focus / Short Break / Long Break) — switching while running shows ConfirmDialog "Switch will reset timer".

Center: ProgressRing (SVG circle, stroke-dasharray) wrapping countdown text `MM:SS`. Inside ring, label "Currently focusing on: {task title}" if selected.

Below ring: 3 buttons — Reset, Start/Pause (toggle), Skip.

Below: FocusTaskSelector — dropdown filtered to tasks with `status ∈ {Todo, InProgress}`, shows title + `⏱ N/M`, plus "No task" option.

Bottom: Today's stats row (sessions count + focus minutes) and recent sessions list (last 5).

End-of-focus modal (only when `task.completedPomodoros >= task.estimatedPomodoros` AND `status !== 'Completed'`):

> "You've reached the estimated pomodoros for **{task.title}**. Mark as completed?"
> [Mark Complete] [Keep Going]

### 9.6 CalendarPage

Header: react-big-calendar built-in toolbar (← → Today, view toggle Month/Week).

Body: month/week grid; events = tasks (allDay rendered at deadline date, single-day). Event color background by priority.

`onSelectSlot(slot)` → set `selectedDate`, render DayTasksPanel below grid.

`onSelectEvent(event)` → opens TaskFormModal (view/edit).

DayTasksPanel: heading "Tasks on {dateLabel}" + list of TaskRow for that day. Empty state when no tasks.

Tailwind/CSS overrides for react-big-calendar to match dark theme (separate `calendar-overrides.css`).

### 9.7 StatisticsPage

Header: page title + RangeSelector (segmented 7 days / 30 days / Month).

Grid:

- Row 1: TaskCompletionChart (BarChart) | PomodoroChart (BarChart)
- Row 2: FocusMinutesChart (LineChart, full width)
- Row 3: PriorityPie | StatusPie

Empty state: "Not enough data yet — complete some tasks or focus sessions to see stats." with illustration.

### 9.8 SettingsPage

Sections (each its own form, own submit button):

**Profile:**

- Full name (editable)
- Email (read-only)

**Change Password:**

- Current password
- New password (min 6)
- Confirm new password
- Submit "Update password"

**Pomodoro durations (minutes):**

- Focus duration (default 25)
- Short break duration (default 5)
- Long break duration (default 15)
- Submit "Save"

**Preferences:**

- Theme: Light / Dark (radio)
- Notifications enabled (toggle)
- Submit "Save"

After durations update: `pomodoroStore.hydrateFromSettings()` so the timer reflects new values immediately.

### 9.9 Empty / Loading / Error states

| Page            | Empty                                           | Loading           | Error                        |
| --------------- | ----------------------------------------------- | ----------------- | ---------------------------- |
| Tasks           | "No tasks yet. Click + Add Task." + button      | Skeleton 3 cards  | "Couldn't load tasks. Retry" |
| Pomodoro recent | "No sessions yet today"                         | Skeleton 3 rows   | –                            |
| Dashboard       | "Welcome! Create your first task" + button      | Skeleton cards    | Retry                        |
| Calendar        | calendar renders, panel: "No tasks on this day" | Skeleton calendar | –                            |
| Statistics      | "Not enough data yet" + illustration            | Skeleton charts   | Retry                        |
| Notifications   | "You're all caught up 🎉"                       | Skeleton items    | –                            |

### 9.10 Responsive breakpoints

- `< sm` (mobile): sidebar drawer, 1-col, charts full-width, modals fullscreen
- `sm-md` (tablet): sidebar drawer, 2-col on dashboard
- `lg+` (desktop): fixed sidebar, full grid

### 9.11 Accessibility

- Icon-only buttons have `aria-label`
- Modals trap focus, return focus on close, escape closes
- Form inputs use label + `aria-describedby` for errors
- Color contrast ≥ AA; priority encoded with both color and icon

---

## 10. Cron Jobs

`server/src/jobs/index.js` registers jobs after DB connection in `index.js`. Jobs are pure functions; cron only triggers them.

### 10.1 `overdueChecker` — `*/5 * * * *` (every 5 min)

```
For each user with notificationEnabled=true:
  tasks = Task.find({
    userId,
    status: { $ne: 'Completed' },
    deadline: { $lt: now }
  })
  For each task:
    exists = Notification.findOne({
      userId, type: 'task_overdue', taskId: task._id,
      createdAt: { $gt: now - 24h }
    })
    if (!exists) {
      Notification.create({
        userId, type: 'task_overdue', taskId,
        title: 'Task overdue',
        message: `"${task.title}" passed its deadline.`,
      })
    }
```

### 10.2 `deadlineSoonReminder` — `*/15 * * * *`

```
For each user with notificationEnabled=true:
  tasks = Task.find({
    userId,
    status: { $ne: 'Completed' },
    deadline: { $gt: now, $lte: now + 1h }
  })
  For each task:
    exists = Notification.findOne({
      userId, type: 'deadline_soon', taskId,
      createdAt: { $gt: now - 2h }
    })
    if (!exists) Notification.create({...})
```

Both jobs caught in try/catch with `console.error`; never crash the process.

---

## 11. Security

### 11.1 Backend

- `helmet()` for security headers (default middleware)
- CORS: `cors({ origin: env.CLIENT_ORIGIN, credentials: false })`
- `express-mongo-sanitize` to strip `$`/`.` from query and body keys
- `express-rate-limit`: 10 req/min on `/api/auth/*`
- bcrypt cost ≥ 10
- JWT secret ≥ 32 bytes random; expiration 7 days
- All private routes verify JWT and attach `req.user`
- `passwordHash` field is `select: false`; `toJSON` transform deletes it as a defense-in-depth
- Every query for user-scoped resources includes `userId`
- IDOR returns 404 (do not leak existence)
- Validation via zod for every body and query

### 11.2 Frontend

- Token stored in localStorage (per spec mục 17). Document XSS risk in README; recommend strict CSP for production deployment.
- Axios interceptor attaches Bearer; 401 (non-auth-route) triggers logout + redirect.
- `.env` not committed; `VITE_API_BASE_URL` is the only public env var used.

### 11.3 Documented limitations

- localStorage tokens are vulnerable to XSS. Production hardening (httpOnly cookie + CSRF) is out of scope per spec.
- No 2FA, account lockout, or password reset flow.

---

## 12. Testing Strategy

### 12.1 Backend

Stack: Jest + Supertest + mongodb-memory-server.

**Setup (`tests/setup.js`):** start in-memory MongoDB before all tests; truncate collections between tests; disconnect after.

**Helper (`createAuthedAgent`):** registers a fresh user, returns supertest agent with token attached.

**Coverage (target ~25 tests):**

- `auth.test.js` — register, login, duplicate email (409), wrong password (401), missing token on /me (401)
- `tasks.test.js` — CRUD, search, filters by status/priority/deadlineFilter, sort, IDOR (user A's task hidden from user B as 404)
- `pomodoro.test.js` — Focus session triggers task increment + status Todo→InProgress; taskId of another user → 403; estimated_reached fires once
- `dashboard.test.js` — counts correct against seeded data
- `statistics.test.js` — range parsing and series shape
- `settings.test.js` — durations update, profile update, password change (correct/wrong current)
- `notifications.test.js` — list, markRead, markAllRead, dedup window for cron-driven types

Test scripts: `npm test` runs Jest with `--runInBand` to share the in-memory mongo instance cleanly.

### 12.2 Frontend

Stack: Vitest + @testing-library/react + jsdom.

**Minimal critical tests:**

- `pomodoroStore.test.ts` — start/pause/resume preserve `remainingMs`; tick at `endsAt` calls `_complete`; mode auto-suggest on focus completion; hydrateFromSettings updates durations
- `taskUtils.test.ts` — isOverdue, priorityRank, deadlineFilter helpers
- `LoginPage.test.tsx` — invalid form shows errors; valid form calls login mutation and navigates

E2E (Playwright/Cypress) is out of scope for MVP.

### 12.3 Manual verification (per acceptance criteria)

After implementation, manually verify:

- Register → auto-login → dashboard
- CRUD task + filter + search + sort
- Pomodoro focus → session saved → task progress increments → estimated_reached prompt
- Dashboard reflects real DB data
- Statistics charts render against seeded data
- Calendar shows tasks on correct days; click task opens modal
- Settings change durations → timer reflects immediately
- Theme toggle works across all pages
- Notifications appear (overdue cron fired manually if needed for verification)
- Responsive on viewport 375px / 768px / 1280px

---

## 13. Environment & Run

### 13.1 `server/.env.example`

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/Task88
JWT_SECRET=replace-with-random-32-byte-hex
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
BCRYPT_COST=10
```

`config/env.js` validates with zod; missing/invalid → process exits with clear message.

### 13.2 `client/.env.example`

```
VITE_API_BASE_URL=/api
```

Vite dev proxy in `vite.config.ts`:

```ts
server: { proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } }
```

### 13.3 Scripts

**Server `package.json`:**

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "seed": "node src/seed/seed.js",
    "seed:reset": "node src/seed/seed.js --reset",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "lint": "eslint src tests",
    "format": "prettier --write \"src/**/*.js\" \"tests/**/*.js\""
  }
}
```

**Client `package.json`:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "test": "vitest"
  }
}
```

### 13.4 First-time run

```
# Backend
cd server
cp .env.example .env       # fill MONGO_URI, JWT_SECRET
npm install
npm run seed:reset
npm run dev                # http://localhost:4000

# Frontend
cd ../client
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
# login: demo@Task88.com / 123456
```

### 13.5 README contents (root)

- Stack summary
- Project structure (2-level tree)
- Prerequisites (Node 20+, MongoDB 6+)
- Setup & run (above)
- Demo account
- API endpoints table (from §6)
- Scripts cheatsheet
- Security notes (localStorage caveat)
- Out-of-scope features list
- Testing instructions

---

## 14. Seed Data

`server/src/seed/seed.js` accepts `--reset` flag. Without `--reset`, exits if collections non-empty.

Seeds:

- 1 user: `demo@Task88.com` / `123456`
- 1 UserSetting (defaults)
- 8 Tasks distributed across:
  - 2 with deadline today (Todo + InProgress, mixed priority)
  - 2 with deadline upcoming (next 3 days)
  - 1 overdue (yesterday, Todo)
  - 3 completed (one in last 7 days, others in last 14 days)
- ~20 PomodoroSessions across the past 14 days, mixing modes; most Focus sessions are `isCompleted: true`
- 3 Notifications: 1 unread `task_overdue`, 1 read `task_completed`, 1 unread `pomodoro_done`

---

## 15. Acceptance Criteria (mapped from spec §21)

- [ ] User can register, log in, log out
- [ ] User can create / edit / delete tasks
- [ ] User can filter and search tasks
- [ ] User can run Pomodoro timer
- [ ] Completed Focus sessions persist to DB
- [ ] Dashboard displays real data
- [ ] Statistics displays charts from real data
- [ ] Calendar shows tasks by deadline
- [ ] Settings allows updating Pomodoro durations
- [ ] No Study Together features anywhere
- [ ] Responsive UI (verified at 375 / 768 / 1280)
- [ ] No runtime errors on golden paths
- [ ] All backend tests pass (~25 cases)
- [ ] All frontend critical tests pass (3 cases)

---

## 16. Implementation Order (handed to writing-plans skill)

The implementation plan (separate document, generated next) will sequence work approximately as:

1. Repo scaffolding (root, .gitignore, README skeleton)
2. Server: setup, env, db, app.js, error handler, asyncHandler, AppError
3. Server: User model + auth (register/login/me) + tests
4. Server: UserSetting model + Settings endpoints + tests
5. Server: Task model (with virtual + indexes) + Task endpoints + tests
6. Server: PomodoroSession model + endpoints + business rules + tests
7. Server: Notification model + endpoints + tests
8. Server: Dashboard endpoint + tests
9. Server: Statistics endpoints + tests
10. Server: Cron jobs + dedup + tests for job logic
11. Server: Seed script
12. Client: scaffolding (Vite + TS + Tailwind + tokens + Router + RQ)
13. Client: stores (auth, theme, pomodoro engine) + tests for engine
14. Client: API layer + axiosClient with interceptors
15. Client: AppLayout + Sidebar + Header + ProtectedRoute
16. Client: LoginPage + RegisterPage
17. Client: TasksPage + TaskFormModal + filters
18. Client: PomodoroPage + ProgressRing + selector + history
19. Client: DashboardPage
20. Client: CalendarPage (react-big-calendar overrides)
21. Client: StatisticsPage (Recharts)
22. Client: SettingsPage (4 sub-forms)
23. Client: NotificationBell + polling + markRead UX
24. Client: theme dark/light verified across all pages
25. Manual verification of acceptance criteria
26. README finalization

Each step ends with running tests (or typecheck for frontend) and committing.
