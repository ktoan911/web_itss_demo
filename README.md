# TaskFlow Clone

Productivity web app: tasks, pomodoro timer, calendar, dashboard, statistics, settings, in-app notifications. Inspired by https://www.taskflow.pro.vn/.

> Study Together is intentionally NOT implemented.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + React Query + Zustand + Recharts + react-big-calendar + sonner + lucide-react
- **Backend:** Node.js 20 + Express + MongoDB (Mongoose) + JWT + bcrypt
- **Tests:** Jest + Supertest + mongodb-memory-server (server), Vitest + Testing Library (client)

## Project layout

```
server/   Express + Mongo API
client/   React SPA
docs/     Design specs and implementation plans
```

## Prerequisites

- Node.js 20 or newer
- MongoDB 6 or newer (local install or MongoDB Atlas)

## Setup & run

### Backend

```bash
cd server
cp .env.example .env
# Edit .env: set MONGO_URI and a strong JWT_SECRET (32+ chars)
npm install
npm run seed:reset       # creates demo user + sample data
npm run dev              # http://localhost:4000
```

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Visit http://localhost:5173 and log in:

- Email: `demo@taskflow.com`
- Password: `123456`

## Run with Docker

A `docker-compose.yml` at the repo root boots MongoDB, the Express API, and an nginx-served production build of the client.

```bash
docker compose up --build
# then in another terminal, seed the demo data:
docker compose exec server npm run seed:reset
# browse http://localhost:8080
```

The client container reverse-proxies `/api` to the `server` service over the internal Docker network, so no extra config is needed. To shut everything down and discard the Mongo volume, run `docker compose down -v`.

> The compose file ships with a development `JWT_SECRET`. Override it via the `environment:` block (or a `docker-compose.override.yml`) before exposing the stack to anything other than localhost.

## Environment variables

### `server/.env`

| Var              | Default                 | Description             |
| ---------------- | ----------------------- | ----------------------- |
| `PORT`           | `4000`                  | API port                |
| `MONGO_URI`      | –                       | Mongo connection string |
| `JWT_SECRET`     | –                       | Required, ≥16 chars     |
| `JWT_EXPIRES_IN` | `7d`                    | JWT lifetime            |
| `CLIENT_ORIGIN`  | `http://localhost:5173` | CORS allowlist          |
| `BCRYPT_COST`    | `10`                    | bcrypt cost factor      |

### `client/.env`

| Var                 | Default | Description                             |
| ------------------- | ------- | --------------------------------------- |
| `VITE_API_BASE_URL` | `/api`  | API base; works with the Vite dev proxy |

## API endpoints (summary)

| Method                    | Path                                                              | Auth |
| ------------------------- | ----------------------------------------------------------------- | ---- |
| POST                      | `/api/auth/register`                                              | –    |
| POST                      | `/api/auth/login`                                                 | –    |
| GET                       | `/api/auth/me`                                                    | ✓    |
| GET / POST / PUT / DELETE | `/api/tasks(/...)`                                                | ✓    |
| PATCH                     | `/api/tasks/:id/status` and `/complete` and `/pomodoro/increment` | ✓    |
| POST                      | `/api/pomodoro-sessions`                                          | ✓    |
| GET                       | `/api/pomodoro-sessions/recent`                                   | ✓    |
| GET                       | `/api/dashboard/summary`                                          | ✓    |
| GET                       | `/api/statistics/tasks?range=...`                                 | ✓    |
| GET                       | `/api/statistics/pomodoros?range=...`                             | ✓    |
| GET / PUT                 | `/api/settings`, `/settings/profile`, `/settings/password`        | ✓    |
| GET / PATCH               | `/api/notifications`, `/:id/read`, `/read-all`                    | ✓    |

## Scripts cheatsheet

| Folder | Command              | Purpose                              |
| ------ | -------------------- | ------------------------------------ |
| server | `npm run dev`        | Start API in watch mode              |
| server | `npm run start`      | Start API in production mode         |
| server | `npm run seed:reset` | Wipe Mongo and seed demo data        |
| server | `npm test`           | Run Jest test suite                  |
| client | `npm run dev`        | Start Vite dev server with API proxy |
| client | `npm run build`      | Build production bundle              |
| client | `npm test`           | Run Vitest                           |
| client | `npm run typecheck`  | `tsc --noEmit`                       |

## Demo account

`demo@taskflow.com` / `123456` (after `npm run seed:reset` in server).

## Security notes

- JWT tokens are stored in `localStorage` per spec. This is vulnerable to XSS; for production deployments add a strict CSP, sanitize all user-provided HTML, and consider migrating to httpOnly cookies + CSRF.
- Passwords are hashed with bcrypt (cost 10).
- Every Mongoose query for user-owned resources filters by `userId`; tests verify cross-user 404 behavior.

## Not implemented (intentional)

- Study Together (and any realtime collaboration)
- Forgot password / email reset
- E2E browser tests
- i18n (UI is English only)

## Tests

```bash
cd server && npm test       # backend ~25 cases
cd client && npm test       # frontend critical tests
```

## Pre-commit

Husky runs Prettier on staged files via lint-staged. Disabled for first-time clones until you run `npm install` at the repo root.

## License

MIT (or replace with your preferred license).
