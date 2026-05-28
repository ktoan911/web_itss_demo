# Task88 Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a productivity web app (Task88 clone) with auth, tasks, pomodoro timer, calendar, dashboard, statistics, settings, and notifications. Per the approved spec at `docs/superpowers/specs/2026-05-27-Task88-clone-design.md`.

**Architecture:** Monorepo with two independent packages — `server/` (Node + Express + MongoDB via Mongoose, JWT auth) and `client/` (React + Vite + TypeScript + Tailwind + React Query + Zustand). Backend layered as routes → controllers → services → models. Frontend uses lazy-loaded pages; pomodoro timer state lives in a Zustand store with `endsAt` timestamps so it survives route changes and tab throttling.

**Tech Stack:** Node 20, Express, Mongoose, JWT, bcrypt, zod, node-cron, Jest, Supertest, mongodb-memory-server, helmet, express-rate-limit, express-mongo-sanitize · React 18, Vite, TypeScript, Tailwind, React Router 6, Axios, @tanstack/react-query, Zustand, react-hook-form, @hookform/resolvers, recharts, react-big-calendar, date-fns, sonner, lucide-react, Vitest, @testing-library/react.

**Conventions for every task:**

- TDD: write failing test → see it fail → minimal code → see it pass → refactor → commit.
- Each commit message follows conventional commits (`feat:`, `chore:`, `test:`, `docs:`, `fix:`).
- All paths are relative to repo root `web_itss_demo/`.
- Commands assume `cd server` or `cd client` as indicated; `pwd` is shown when relevant.
- "JSON-like spec" code blocks use `// comment` for clarity; engineer should treat them as the source.

---

## File Structure (final state)

```
web_itss_demo/
├── README.md
├── .gitignore
├── docs/superpowers/{specs,plans}/...
├── server/
│   ├── package.json
│   ├── .env.example  .env (gitignored)
│   ├── jest.config.js
│   ├── nodemon.json
│   ├── .eslintrc.json  .prettierrc
│   ├── src/
│   │   ├── index.js               # boot: env→db→cron→listen
│   │   ├── app.js                 # express app + middleware + routes
│   │   ├── config/{env.js,db.js}
│   │   ├── models/{User,Task,PomodoroSession,UserSetting,Notification}.js
│   │   ├── routes/{auth,task,pomodoro,dashboard,statistics,settings,notification}.routes.js + index.js
│   │   ├── controllers/{auth,task,pomodoro,dashboard,statistics,settings,notification}.controller.js
│   │   ├── services/{auth,jwt,task,pomodoro,dashboard,statistics,settings,notification}.service.js
│   │   ├── middlewares/{auth,validate,rateLimit,error}.middleware.js
│   │   ├── validators/{auth,task,pomodoro,settings,common}.validator.js
│   │   ├── utils/{passwordHasher,asyncHandler,AppError,dateRange,priorityRank}.js
│   │   ├── jobs/{index,overdueChecker,deadlineSoonReminder}.js
│   │   └── seed/seed.js
│   └── tests/
│       ├── setup.js
│       ├── helpers/createAuthedAgent.js
│       └── {auth,tasks,pomodoro,dashboard,statistics,settings,notifications}.test.js
└── client/
    ├── package.json  vite.config.ts  tailwind.config.js  postcss.config.js  tsconfig.json
    ├── .env.example  .env (gitignored)
    ├── index.html
    └── src/
        ├── main.tsx  App.tsx  index.css
        ├── api/{axiosClient,authApi,taskApi,pomodoroApi,dashboardApi,statisticsApi,settingsApi,notificationApi}.ts
        ├── routes/{AppRouter,ProtectedRoute,PublicOnlyRoute}.tsx
        ├── pages/{Login,Register,Dashboard,Tasks,Pomodoro,Calendar,Statistics,Settings,NotFound}Page.tsx
        ├── components/{layout,common,tasks,pomodoro,dashboard,calendar,statistics,notifications}/...
        ├── hooks/queries/{useAuth,useTask,usePomodoro,useDashboard,useStatistics,useSettings,useNotification}Queries.ts
        ├── hooks/{useAuth,useDebounce,useTheme,usePomodoroEngine}.ts
        ├── store/{authStore,themeStore,pomodoroStore}.ts
        ├── types/{auth,task,pomodoro,statistics,settings,notification}.ts
        ├── utils/{dateUtils,taskUtils,formatters}.ts
        ├── lib/{queryClient,audio}.ts
        └── validators/{auth,task,settings}.schema.ts
```

---

## Task 1: Repo scaffolding + root README skeleton

**Files:**

- Create: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Write `.gitignore`**

```gitignore
# deps
node_modules/

# env
.env
.env.local
.env.*.local

# build
dist/
build/
client/dist/
server/dist/

# logs
*.log
npm-debug.log*

# coverage
coverage/

# os / editor
.DS_Store
.vscode/
.idea/
```

- [ ] **Step 2: Replace root `README.md` with skeleton**

```markdown
# Task88 Clone

A productivity web app with tasks, pomodoro timer, calendar, dashboard, statistics, and settings. Inspired by https://www.Task88.pro.vn/.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + React Query + Zustand + Recharts + react-big-calendar
- **Backend:** Node.js 20 + Express + MongoDB (Mongoose) + JWT + bcrypt
- **Tests:** Jest + Supertest (server), Vitest + Testing Library (client)

## Project layout
```

server/ Express + Mongo API
client/ React SPA
docs/ Design specs and implementation plans

```

## Prerequisites
- Node.js 20+
- MongoDB 6+ (local install or Atlas)

## Run (will be detailed once implemented)
See task 24 for finalized README.

## Demo account
`demo@Task88.com` / `123456` (after running `npm run seed:reset` in `server/`).
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore README.md
git commit -m "chore: scaffold repo with .gitignore and README skeleton"
```

---

## Task 2: Server skeleton — package.json, env, db, app, index

**Files:**

- Create: `server/package.json`, `server/nodemon.json`, `server/.env.example`, `server/jest.config.js`, `server/.eslintrc.json`, `server/.prettierrc`
- Create: `server/src/{index.js,app.js}`
- Create: `server/src/config/{env.js,db.js}`

- [ ] **Step 1: Init `server/package.json`**

From repo root:

```bash
mkdir -p server && cd server
npm init -y
npm pkg set name=Task88-server type=module engines.node=">=20"
npm pkg set scripts.dev="nodemon src/index.js"
npm pkg set scripts.start="node src/index.js"
npm pkg set scripts.seed="node src/seed/seed.js"
npm pkg set scripts.seed:reset="node src/seed/seed.js --reset"
npm pkg set scripts.test="NODE_OPTIONS=--experimental-vm-modules jest --runInBand"
npm pkg set scripts.test:watch="NODE_OPTIONS=--experimental-vm-modules jest --watch"
npm pkg set scripts.lint="eslint src tests"
npm pkg set scripts.format="prettier --write \"src/**/*.js\" \"tests/**/*.js\""
```

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
npm install express mongoose bcryptjs jsonwebtoken zod cors helmet \
  express-rate-limit express-mongo-sanitize node-cron date-fns dotenv

npm install --save-dev nodemon jest supertest mongodb-memory-server \
  eslint eslint-plugin-n prettier
```

- [ ] **Step 3: Write `server/nodemon.json`**

```json
{ "watch": ["src"], "ext": "js,json", "ignore": ["src/seed/*"] }
```

- [ ] **Step 4: Write `server/.env.example`**

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/Task88
JWT_SECRET=replace-with-32-bytes-of-randomness
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
BCRYPT_COST=10
```

Then `cp .env.example .env` (the .env is gitignored; engineer fills real values).

- [ ] **Step 5: Write `server/jest.config.js`**

```js
export default {
  testEnvironment: 'node',
  setupFilesAfterEach: [],
  globalSetup: undefined,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEach: ['<rootDir>/tests/setup.js'],
  transform: {},
  testTimeout: 30_000,
  verbose: true,
};
```

(Note: with `type: module`, Jest needs `NODE_OPTIONS=--experimental-vm-modules` — already set in `npm test` script.)

- [ ] **Step 6: Write `server/.eslintrc.json`**

```json
{
  "env": { "node": true, "es2024": true, "jest": true },
  "extends": ["eslint:recommended", "plugin:n/recommended"],
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "rules": {
    "n/no-missing-import": "off",
    "n/no-unpublished-import": "off",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

- [ ] **Step 7: Write `server/.prettierrc`**

```json
{ "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```

- [ ] **Step 8: Write `server/src/config/env.js`**

```js
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(10),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

- [ ] **Step 9: Write `server/src/config/db.js`**

```js
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uri = env.MONGO_URI) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
```

- [ ] **Step 10: Write `server/src/app.js`** (placeholder — middleware filled later)

```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';

export function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Task88-api' }));

  // routes mounted in Task 5+
  // error handler mounted in Task 3
  return app;
}
```

- [ ] **Step 11: Write `server/src/index.js`**

```js
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { buildApp } from './app.js';

async function bootstrap() {
  await connectDB();
  const app = buildApp();
  app.listen(env.PORT, () => console.log(`🚀 Server on :${env.PORT}`));
}

bootstrap().catch((err) => {
  console.error('Boot failure', err);
  process.exit(1);
});
```

- [ ] **Step 12: Smoke test boot (manual)**

```bash
cd server && npm run dev
# In another terminal:
curl http://localhost:4000/api/health
# Expected: {"ok":true,"service":"Task88-api"}
# Stop server with Ctrl+C
```

- [ ] **Step 13: Commit**

```bash
cd .. # repo root
git add server
git commit -m "feat(server): scaffold express app with env validation and mongo connection"
```

---

## Task 3: Error handling — AppError, asyncHandler, validate middleware, errorHandler

**Files:**

- Create: `server/src/utils/{AppError.js,asyncHandler.js}`
- Create: `server/src/middlewares/{error.middleware.js,validate.middleware.js}`
- Modify: `server/src/app.js`
- Create: `server/tests/setup.js`

- [ ] **Step 1: Write `server/src/utils/AppError.js`**

```js
export class AppError extends Error {
  constructor(message, statusCode = 500, code, fields) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
  }
}
```

- [ ] **Step 2: Write `server/src/utils/asyncHandler.js`**

```js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

- [ ] **Step 3: Write `server/src/middlewares/validate.middleware.js`**

```js
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

// validate({ body?, query?, params? }) → middleware
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = {};
      for (const issue of err.issues) fields[issue.path.join('.')] = issue.message;
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', fields));
    }
    next(err);
  }
};
```

- [ ] **Step 4: Write `server/src/middlewares/error.middleware.js`**

```js
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFound(_req, res) {
  res.status(404).json({ error: { message: 'Route not found' } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, fields: err.fields },
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { message: 'Invalid id' } });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: { message: 'Duplicate key', fields: err.keyValue } });
  }
  if (env.NODE_ENV !== 'test') console.error('UNHANDLED', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
```

- [ ] **Step 5: Wire into `server/src/app.js`**

Replace `app.js` body:

```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

export function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Task88-api' }));

  // ROUTES_MOUNT — added in subsequent tasks

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
```

- [ ] **Step 6: Write `server/tests/setup.js`** (in-memory mongo)

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
  process.env.NODE_ENV = 'test';
  process.env.BCRYPT_COST = '4';
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  for (const c of Object.values(mongoose.connection.collections)) {
    await c.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
```

- [ ] **Step 7: Smoke-test it boots**

```bash
cd server && npm test -- --listTests
# Expected: no errors (no test files yet, so empty list)
```

- [ ] **Step 8: Commit**

```bash
git add server
git commit -m "feat(server): add error handler, validate middleware, asyncHandler, test setup"
```

---

## Task 4: User model + JWT service + password hasher + auth middleware

**Files:**

- Create: `server/src/models/User.js`
- Create: `server/src/services/jwt.service.js`
- Create: `server/src/utils/passwordHasher.js`
- Create: `server/src/middlewares/auth.middleware.js`
- Create: `server/src/middlewares/rateLimit.middleware.js`

- [ ] **Step 1: Write `server/src/models/User.js`**

```js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
```

- [ ] **Step 2: Write `server/src/utils/passwordHasher.js`**

```js
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_COST);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
```

- [ ] **Step 3: Write `server/src/services/jwt.service.js`**

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);
```

- [ ] **Step 4: Write `server/src/middlewares/auth.middleware.js`**

```js
import { verifyToken } from '../services/jwt.service.js';
import { AppError } from '../utils/AppError.js';

export function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError('Unauthorized', 401));
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
```

- [ ] **Step 5: Write `server/src/middlewares/rateLimit.middleware.js`**

```js
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, slow down.' } },
});
```

- [ ] **Step 6: Commit**

```bash
git add server
git commit -m "feat(server): User model, JWT service, password hasher, auth middleware"
```

---

## Task 5: Auth routes (register / login / me) + tests

**Files:**

- Create: `server/src/validators/auth.validator.js`
- Create: `server/src/services/auth.service.js`
- Create: `server/src/controllers/auth.controller.js`
- Create: `server/src/routes/auth.routes.js`
- Create: `server/src/routes/index.js`
- Modify: `server/src/app.js`
- Create: `server/tests/helpers/createAuthedAgent.js`
- Create: `server/tests/auth.test.js`

- [ ] **Step 1: Write failing tests `server/tests/auth.test.js`**

```js
import request from 'supertest';
import { buildApp } from '../src/app.js';

const app = buildApp();
const ROUTE = '/api/auth';

const validRegister = {
  fullName: 'Demo User',
  email: 'demo@example.com',
  password: '123456',
  confirmPassword: '123456',
};

describe('POST /api/auth/register', () => {
  it('registers a new user and returns token + user', async () => {
    const res = await request(app).post(`${ROUTE}/register`).send(validRegister);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'demo@example.com', fullName: 'Demo User' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects mismatched passwords', async () => {
    const res = await request(app)
      .post(`${ROUTE}/register`)
      .send({ ...validRegister, confirmPassword: 'wrong1' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toBeDefined();
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post(`${ROUTE}/register`).send(validRegister);
    const res = await request(app).post(`${ROUTE}/register`).send(validRegister);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token for correct credentials', async () => {
    await request(app).post(`${ROUTE}/register`).send(validRegister);
    const res = await request(app)
      .post(`${ROUTE}/login`)
      .send({ email: validRegister.email, password: validRegister.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects wrong password with 401', async () => {
    await request(app).post(`${ROUTE}/register`).send(validRegister);
    const res = await request(app)
      .post(`${ROUTE}/login`)
      .send({ email: validRegister.email, password: 'wrong1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects request without token', async () => {
    const res = await request(app).get(`${ROUTE}/me`);
    expect(res.status).toBe(401);
  });

  it('returns current user with valid token', async () => {
    const reg = await request(app).post(`${ROUTE}/register`).send(validRegister);
    const res = await request(app)
      .get(`${ROUTE}/me`)
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validRegister.email);
  });
});
```

- [ ] **Step 2: Run tests; confirm all FAIL**

```bash
cd server && npm test -- tests/auth.test.js
# Expected: 7 failing (route 404 / module not found)
```

- [ ] **Step 3: Write `server/src/validators/auth.validator.js`**

```js
import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(1).max(100),
    email: z.string().email().toLowerCase(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
```

- [ ] **Step 4: Write `server/src/services/auth.service.js`** (Task 6 will extend `register` to also create a `UserSetting`; for now create user only)

```js
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/passwordHasher.js';
import { signToken } from './jwt.service.js';
import { AppError } from '../utils/AppError.js';

const toClientUser = (u) => ({ id: u._id.toString(), fullName: u.fullName, email: u.email });

export const authService = {
  async register({ fullName, email, password }) {
    const exists = await User.findOne({ email });
    if (exists) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
    const passwordHash = await hashPassword(password);
    const user = await User.create({ fullName, email, passwordHash });
    // UserSetting auto-create wired in Task 6 by importing settingsService
    const token = signToken({ id: user._id.toString(), email: user.email });
    return { token, user: toClientUser(user) };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw new AppError('Invalid credentials', 401);
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new AppError('Invalid credentials', 401);
    const token = signToken({ id: user._id.toString(), email: user.email });
    return { token, user: toClientUser(user) };
  },

  async me(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return { user: toClientUser(user) };
  },
};
```

- [ ] **Step 5: Write `server/src/controllers/auth.controller.js`**

```js
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),
  me: asyncHandler(async (req, res) => {
    const result = await authService.me(req.user.id);
    res.json(result);
  }),
};
```

- [ ] **Step 6: Write `server/src/routes/auth.routes.js`**

```js
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();
router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', authRequired, authController.me);

export default router;
```

- [ ] **Step 7: Write `server/src/routes/index.js`**

```js
import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();
router.use('/auth', authRoutes);

export default router;
```

- [ ] **Step 8: Mount in `app.js`** — replace the `// ROUTES_MOUNT` comment with:

```js
import apiRoutes from './routes/index.js';
// ... inside buildApp(), after health route:
app.use('/api', apiRoutes);
```

- [ ] **Step 9: Write `server/tests/helpers/createAuthedAgent.js`**

```js
import request from 'supertest';

export async function createAuthedAgent(app, overrides = {}) {
  const body = {
    fullName: overrides.fullName ?? 'Test User',
    email: overrides.email ?? `u${Date.now()}${Math.random().toString(16).slice(2, 6)}@x.com`,
    password: overrides.password ?? '123456',
  };
  const res = await request(app)
    .post('/api/auth/register')
    .send({ ...body, confirmPassword: body.password });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  const token = res.body.token;
  const userId = res.body.user.id;

  const wrap = (method) => (path) =>
    request(app)[method](path).set('Authorization', `Bearer ${token}`);

  return {
    token,
    userId,
    user: res.body.user,
    get: wrap('get'),
    post: wrap('post'),
    put: wrap('put'),
    patch: wrap('patch'),
    delete: wrap('delete'),
  };
}
```

- [ ] **Step 10: Run tests; confirm PASS**

```bash
cd server && npm test -- tests/auth.test.js
# Expected: 7 passing
```

- [ ] **Step 11: Commit**

```bash
git add server
git commit -m "feat(server): auth register/login/me with JWT, validation, tests"
```

---

## Task 6: UserSetting model + settings endpoints + tests

**Files:**

- Create: `server/src/models/UserSetting.js`
- Create: `server/src/services/settings.service.js`
- Create: `server/src/controllers/settings.controller.js`
- Create: `server/src/validators/settings.validator.js`
- Create: `server/src/routes/settings.routes.js`
- Modify: `server/src/services/auth.service.js` (auto-create UserSetting on register)
- Modify: `server/src/routes/index.js`
- Create: `server/tests/settings.test.js`

- [ ] **Step 1: Write `server/src/models/UserSetting.js`**

```js
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    focusDuration: { type: Number, default: 25, min: 1, max: 120 },
    shortBreakDuration: { type: Number, default: 5, min: 1, max: 60 },
    longBreakDuration: { type: Number, default: 15, min: 1, max: 60 },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notificationEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

export const UserSetting = mongoose.model('UserSetting', settingSchema);
```

- [ ] **Step 2: Write failing tests `server/tests/settings.test.js`**

```js
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
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      theme: 'light',
      notificationEnabled: true,
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
      currentPassword: '123456',
      newPassword: 'newpass1',
      confirmPassword: 'newpass1',
    });
    expect(res.status).toBe(200);
  });

  it('rejects wrong current password', async () => {
    const a = await createAuthedAgent(app);
    const res = await a.put('/api/settings/password').send({
      currentPassword: 'wrong1',
      newPassword: 'newpass1',
      confirmPassword: 'newpass1',
    });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Write `server/src/validators/settings.validator.js`**

```js
import { z } from 'zod';

export const settingsUpdateSchema = z
  .object({
    focusDuration: z.number().int().min(1).max(120).optional(),
    shortBreakDuration: z.number().int().min(1).max(60).optional(),
    longBreakDuration: z.number().int().min(1).max(60).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    notificationEnabled: z.boolean().optional(),
  })
  .strict();

export const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
```

- [ ] **Step 4: Write `server/src/services/settings.service.js`**

```js
import { UserSetting } from '../models/UserSetting.js';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/passwordHasher.js';
import { AppError } from '../utils/AppError.js';

export const settingsService = {
  async ensureForUser(userId) {
    const existing = await UserSetting.findOne({ userId });
    if (existing) return existing;
    return UserSetting.create({ userId });
  },

  async get(userId) {
    return this.ensureForUser(userId);
  },

  async update(userId, patch) {
    return UserSetting.findOneAndUpdate({ userId }, { $set: patch }, { new: true, upsert: true });
  },

  async updateProfile(userId, { fullName }) {
    const user = await User.findByIdAndUpdate(userId, { $set: { fullName } }, { new: true });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new AppError('User not found', 404);
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new AppError('Current password is incorrect', 401);
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    return { ok: true };
  },
};
```

- [ ] **Step 5: Update `server/src/services/auth.service.js`** — register now also creates UserSetting

Replace `register` body:

```js
async register({ fullName, email, password }) {
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
  const passwordHash = await hashPassword(password);
  const user = await User.create({ fullName, email, passwordHash });
  try {
    await settingsService.ensureForUser(user._id);
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }
  const token = signToken({ id: user._id.toString(), email: user.email });
  return { token, user: toClientUser(user) };
},
```

Add the import at top of `auth.service.js`:

```js
import { settingsService } from './settings.service.js';
```

- [ ] **Step 6: Write `server/src/controllers/settings.controller.js`**

```js
import { settingsService } from '../services/settings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsController = {
  get: asyncHandler(async (req, res) => res.json(await settingsService.get(req.user.id))),
  update: asyncHandler(async (req, res) =>
    res.json(await settingsService.update(req.user.id, req.body)),
  ),
  updateProfile: asyncHandler(async (req, res) =>
    res.json(await settingsService.updateProfile(req.user.id, req.body)),
  ),
  changePassword: asyncHandler(async (req, res) =>
    res.json(await settingsService.changePassword(req.user.id, req.body)),
  ),
};
```

- [ ] **Step 7: Write `server/src/routes/settings.routes.js`**

```js
import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
  settingsUpdateSchema,
  profileUpdateSchema,
  passwordChangeSchema,
} from '../validators/settings.validator.js';

const router = Router();
router.use(authRequired);

router.get('/', settingsController.get);
router.put('/', validate({ body: settingsUpdateSchema }), settingsController.update);
router.put('/profile', validate({ body: profileUpdateSchema }), settingsController.updateProfile);
router.put(
  '/password',
  validate({ body: passwordChangeSchema }),
  settingsController.changePassword,
);

export default router;
```

- [ ] **Step 8: Mount in `routes/index.js`**

```js
import settingsRoutes from './settings.routes.js';
router.use('/settings', settingsRoutes);
```

- [ ] **Step 9: Run tests; confirm PASS**

```bash
npm test -- tests/settings.test.js tests/auth.test.js
# Expected: all green
```

- [ ] **Step 10: Commit**

```bash
git add server
git commit -m "feat(server): UserSetting model + settings endpoints (get/update/profile/password)"
```

---

## Task 7: Task model + priorityRank + virtual isOverdue + indexes

**Files:**

- Create: `server/src/models/Task.js`
- Create: `server/src/utils/priorityRank.js`

- [ ] **Step 1: Write `server/src/utils/priorityRank.js`**

```js
export const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3 };
export const rankOf = (priority) => PRIORITY_RANK[priority] ?? 0;
```

- [ ] **Step 2: Write `server/src/models/Task.js`**

```js
import mongoose from 'mongoose';
import { rankOf } from '../utils/priorityRank.js';

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    priorityRank: { type: Number, default: 0 },
    status: { type: String, enum: ['Todo', 'InProgress', 'Completed'], default: 'Todo' },
    estimatedPomodoros: { type: Number, default: 1, min: 1 },
    completedPomodoros: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        delete ret.priorityRank;
        return ret;
      },
    },
  },
);

taskSchema.virtual('isOverdue').get(function () {
  return this.deadline < new Date() && this.status !== 'Completed';
});

taskSchema.pre('save', function (next) {
  if (this.isModified('priority')) this.priorityRank = rankOf(this.priority);
  next();
});

taskSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const setBlock = update.$set || update;
  if (setBlock.priority) {
    if (update.$set) update.$set.priorityRank = rankOf(setBlock.priority);
    else update.priorityRank = rankOf(setBlock.priority);
  }
  next();
});

taskSchema.index({ userId: 1, deadline: 1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, priorityRank: -1 });
taskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model('Task', taskSchema);
```

- [ ] **Step 3: Commit**

```bash
git add server
git commit -m "feat(server): Task model with virtual isOverdue, priorityRank, indexes"
```

---

## Task 8: Task service + controller + routes + tests (CRUD, filter, search, sort, IDOR)

**Files:**

- Create: `server/src/services/task.service.js`
- Create: `server/src/controllers/task.controller.js`
- Create: `server/src/validators/task.validator.js`
- Create: `server/src/routes/task.routes.js`
- Modify: `server/src/routes/index.js`
- Create: `server/src/utils/dateRange.js`
- Create: `server/tests/tasks.test.js`

- [ ] **Step 1: Write `server/src/utils/dateRange.js`**

```js
import { startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns';

export function deadlineFilterToQuery(filter, now = new Date()) {
  switch (filter) {
    case 'today':
      return { deadline: { $gte: startOfDay(now), $lte: endOfDay(now) } };
    case 'upcoming':
      return { deadline: { $gt: now }, status: { $ne: 'Completed' } };
    case 'overdue':
      return { deadline: { $lt: now }, status: { $ne: 'Completed' } };
    case 'completed':
      return { status: 'Completed' };
    default:
      return {};
  }
}

export function parseStatRange(range, now = new Date()) {
  switch (range) {
    case '30days':
      return { start: startOfDay(subDays(now, 29)), end: now };
    case 'month':
      return { start: startOfMonth(now), end: now };
    case '7days':
    default:
      return { start: startOfDay(subDays(now, 6)), end: now };
  }
}
```

- [ ] **Step 2: Write `server/src/validators/task.validator.js`**

```js
import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  deadline: z.coerce.date(),
  priority: z.enum(['Low', 'Medium', 'High']),
  estimatedPomodoros: z.coerce.number().int().min(1).default(1),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const taskListQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(['Todo', 'InProgress', 'Completed']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    deadlineFilter: z.enum(['today', 'upcoming', 'overdue', 'completed']).optional(),
    sortBy: z.enum(['deadline', 'priority', 'newest']).default('deadline'),
  })
  .strict();

export const taskIdParam = z.object({ id: objectId });

export const taskStatusSchema = z.object({
  status: z.enum(['Todo', 'InProgress', 'Completed']),
});
```

- [ ] **Step 3: Write `server/src/services/task.service.js`**

```js
import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { deadlineFilterToQuery } from '../utils/dateRange.js';

const sortMap = {
  deadline: { deadline: 1 },
  priority: { priorityRank: -1, deadline: 1 },
  newest: { createdAt: -1 },
};

const notFound = () => new AppError('Task not found', 404);

export const taskService = {
  async list(userId, query) {
    const filter = { userId, ...deadlineFilterToQuery(query.deadlineFilter) };
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search) filter.$text = { $search: query.search };
    return Task.find(filter).sort(sortMap[query.sortBy ?? 'deadline']);
  },

  async get(userId, id) {
    const task = await Task.findOne({ _id: id, userId });
    if (!task) throw notFound();
    return task;
  },

  async create(userId, body) {
    return Task.create({ ...body, userId });
  },

  async update(userId, id, body) {
    const task = await Task.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true, runValidators: true },
    );
    if (!task) throw notFound();
    return task;
  },

  async remove(userId, id) {
    const r = await Task.findOneAndDelete({ _id: id, userId });
    if (!r) throw notFound();
    return { ok: true };
  },

  async changeStatus(userId, id, status) {
    const update = { status };
    if (status === 'Completed') update.completedAt = new Date();
    const task = await Task.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true });
    if (!task) throw notFound();
    return task;
  },

  async markCompleted(userId, id) {
    const task = await Task.findOne({ _id: id, userId });
    if (!task) throw notFound();
    if (task.status === 'Completed') return task;
    task.status = 'Completed';
    task.completedAt = new Date();
    await task.save();
    return task;
  },

  async incrementPomodoro(userId, id) {
    const task = await Task.findOne({ _id: id, userId });
    if (!task) throw notFound();
    task.completedPomodoros += 1;
    if (task.status === 'Todo') task.status = 'InProgress';
    await task.save();
    return task;
  },
};
```

- [ ] **Step 4: Write `server/src/controllers/task.controller.js`**

```js
import { taskService } from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const uid = (req) => req.user.id;

export const taskController = {
  list: asyncHandler(async (req, res) => res.json(await taskService.list(uid(req), req.query))),
  get: asyncHandler(async (req, res) => res.json(await taskService.get(uid(req), req.params.id))),
  create: asyncHandler(async (req, res) =>
    res.status(201).json(await taskService.create(uid(req), req.body)),
  ),
  update: asyncHandler(async (req, res) =>
    res.json(await taskService.update(uid(req), req.params.id, req.body)),
  ),
  remove: asyncHandler(async (req, res) =>
    res.json(await taskService.remove(uid(req), req.params.id)),
  ),
  changeStatus: asyncHandler(async (req, res) =>
    res.json(await taskService.changeStatus(uid(req), req.params.id, req.body.status)),
  ),
  markCompleted: asyncHandler(async (req, res) =>
    res.json(await taskService.markCompleted(uid(req), req.params.id)),
  ),
  incrementPomo: asyncHandler(async (req, res) =>
    res.json(await taskService.incrementPomodoro(uid(req), req.params.id)),
  ),
};
```

- [ ] **Step 5: Write `server/src/routes/task.routes.js`**

```js
import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  taskCreateSchema,
  taskUpdateSchema,
  taskListQuerySchema,
  taskIdParam,
  taskStatusSchema,
} from '../validators/task.validator.js';

const router = Router();
router.use(authRequired);

router.get('/', validate({ query: taskListQuerySchema }), taskController.list);
router.post('/', validate({ body: taskCreateSchema }), taskController.create);
router.get('/:id', validate({ params: taskIdParam }), taskController.get);
router.put(
  '/:id',
  validate({ params: taskIdParam, body: taskUpdateSchema }),
  taskController.update,
);
router.delete('/:id', validate({ params: taskIdParam }), taskController.remove);
router.patch(
  '/:id/status',
  validate({ params: taskIdParam, body: taskStatusSchema }),
  taskController.changeStatus,
);
router.patch('/:id/complete', validate({ params: taskIdParam }), taskController.markCompleted);
router.patch(
  '/:id/pomodoro/increment',
  validate({ params: taskIdParam }),
  taskController.incrementPomo,
);

export default router;
```

- [ ] **Step 6: Mount in `routes/index.js`**

```js
import taskRoutes from './task.routes.js';
router.use('/tasks', taskRoutes);
```

- [ ] **Step 7: Write `server/tests/tasks.test.js`** (TDD — before tests are run, the routes already exist; this is integration testing)

```js
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
```

- [ ] **Step 8: Run tests; confirm PASS**

```bash
npm test -- tests/tasks.test.js
# Expected: 9 passing
```

- [ ] **Step 9: Commit**

```bash
git add server
git commit -m "feat(server): tasks CRUD with filters, search, sort, IDOR protection"
```

---

## Task 9: Notification model + service (used by other modules) + endpoints + tests

**Files:**

- Create: `server/src/models/Notification.js`
- Create: `server/src/services/notification.service.js`
- Create: `server/src/controllers/notification.controller.js`
- Create: `server/src/routes/notification.routes.js`
- Modify: `server/src/routes/index.js`
- Create: `server/tests/notifications.test.js`

- [ ] **Step 1: Write `server/src/models/Notification.js`**

```js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'task_overdue',
        'task_completed',
        'pomodoro_done',
        'deadline_soon',
        'estimated_reached',
      ],
      required: true,
    },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false },
  },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, taskId: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
```

- [ ] **Step 2: Write `server/src/services/notification.service.js`**

```js
import { Notification } from '../models/Notification.js';
import { UserSetting } from '../models/UserSetting.js';
import { AppError } from '../utils/AppError.js';

async function userAllowsNotifications(userId) {
  const s = await UserSetting.findOne({ userId });
  return !s || s.notificationEnabled !== false;
}

export const notificationService = {
  async create(userId, { title, message, type, taskId = null }) {
    if (!(await userAllowsNotifications(userId))) return null;
    return Notification.create({ userId, title, message, type, taskId });
  },

  async createDeduped(userId, { title, message, type, taskId = null, withinMs }) {
    if (!(await userAllowsNotifications(userId))) return null;
    const since = new Date(Date.now() - withinMs);
    const exists = await Notification.findOne({ userId, type, taskId, createdAt: { $gt: since } });
    if (exists) return null;
    return Notification.create({ userId, title, message, type, taskId });
  },

  async list(userId, limit = 20) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  },

  async markRead(userId, id) {
    const n = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true } },
      { new: true },
    );
    if (!n) throw new AppError('Notification not found', 404);
    return n;
  },

  async markAllRead(userId) {
    const r = await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    return { count: r.modifiedCount };
  },
};
```

- [ ] **Step 3: Write `server/src/controllers/notification.controller.js`**

```js
import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json(await notificationService.list(req.user.id, limit));
  }),
  markRead: asyncHandler(async (req, res) =>
    res.json(await notificationService.markRead(req.user.id, req.params.id)),
  ),
  markAllRead: asyncHandler(async (req, res) =>
    res.json(await notificationService.markAllRead(req.user.id)),
  ),
};
```

- [ ] **Step 4: Write `server/src/routes/notification.routes.js`**

```js
import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { z } from 'zod';

const router = Router();
router.use(authRequired);

const idParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

router.get('/', notificationController.list);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', validate({ params: idParam }), notificationController.markRead);

export default router;
```

- [ ] **Step 5: Mount in `routes/index.js`**

```js
import notificationRoutes from './notification.routes.js';
router.use('/notifications', notificationRoutes);
```

- [ ] **Step 6: Write `server/tests/notifications.test.js`**

```js
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
      title: 't',
      message: 'm',
      type: 'task_completed',
    });
    const r = await a.patch(`/api/notifications/${n._id}/read`);
    expect(r.body.isRead).toBe(true);
  });

  it('mark all read', async () => {
    const a = await createAuthedAgent(app);
    await notificationService.create(a.userId, {
      title: 'a',
      message: 'a',
      type: 'task_completed',
    });
    await notificationService.create(a.userId, { title: 'b', message: 'b', type: 'pomodoro_done' });
    const r = await a.patch('/api/notifications/read-all');
    expect(r.body.count).toBe(2);
  });

  it('createDeduped suppresses within window', async () => {
    const a = await createAuthedAgent(app);
    const taskId = '507f1f77bcf86cd799439011';
    const first = await notificationService.createDeduped(a.userId, {
      title: 't',
      message: 'm',
      type: 'task_overdue',
      taskId,
      withinMs: 86_400_000,
    });
    const second = await notificationService.createDeduped(a.userId, {
      title: 't',
      message: 'm',
      type: 'task_overdue',
      taskId,
      withinMs: 86_400_000,
    });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('respects notificationEnabled=false', async () => {
    const a = await createAuthedAgent(app);
    await a.put('/api/settings').send({ notificationEnabled: false });
    const n = await notificationService.create(a.userId, {
      title: 't',
      message: 'm',
      type: 'task_completed',
    });
    expect(n).toBeNull();
  });
});
```

- [ ] **Step 7: Run tests; confirm PASS**

```bash
npm test -- tests/notifications.test.js
# Expected: 5 passing
```

- [ ] **Step 8: Commit**

```bash
git add server
git commit -m "feat(server): Notification model, service, endpoints, dedup"
```

---

## Task 10: Pomodoro session model + service + endpoints + tests (with task increment, notifications)

**Files:**

- Create: `server/src/models/PomodoroSession.js`
- Create: `server/src/services/pomodoro.service.js`
- Create: `server/src/controllers/pomodoro.controller.js`
- Create: `server/src/validators/pomodoro.validator.js`
- Create: `server/src/routes/pomodoro.routes.js`
- Modify: `server/src/services/task.service.js` (extend incrementPomodoro to fire estimated_reached notification)
- Modify: `server/src/routes/index.js`
- Create: `server/tests/pomodoro.test.js`

- [ ] **Step 1: Write `server/src/models/PomodoroSession.js`**

```js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    mode: { type: String, enum: ['Focus', 'ShortBreak', 'LongBreak'], required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

sessionSchema.index({ userId: 1, startedAt: -1 });
sessionSchema.index({ taskId: 1, isCompleted: 1 });

export const PomodoroSession = mongoose.model('PomodoroSession', sessionSchema);
```

- [ ] **Step 2: Write `server/src/validators/pomodoro.validator.js`**

```js
import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

export const sessionCreateSchema = z.object({
  taskId: objectId.nullable().optional(),
  mode: z.enum(['Focus', 'ShortBreak', 'LongBreak']),
  durationMinutes: z.number().int().min(1).max(180),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable().optional(),
  isCompleted: z.boolean().default(false),
});
```

- [ ] **Step 3: Update `server/src/services/task.service.js`** — replace `incrementPomodoro`:

```js
async incrementPomodoro(userId, id) {
  const task = await Task.findOne({ _id: id, userId });
  if (!task) throw notFound();
  task.completedPomodoros += 1;
  if (task.status === 'Todo') task.status = 'InProgress';
  await task.save();
  if (
    task.completedPomodoros >= task.estimatedPomodoros &&
    task.status !== 'Completed'
  ) {
    await notificationService.createDeduped(userId, {
      title: 'Estimated pomodoros reached',
      message: `You've reached the estimated pomodoros for "${task.title}".`,
      type: 'estimated_reached',
      taskId: task._id,
      withinMs: 365 * 86_400_000, // effectively once per task
    });
  }
  return task;
},
```

Add to top of `task.service.js`:

```js
import { notificationService } from './notification.service.js';
```

Also extend `markCompleted` to fire `task_completed`:

```js
async markCompleted(userId, id) {
  const task = await Task.findOne({ _id: id, userId });
  if (!task) throw notFound();
  if (task.status === 'Completed') return task;
  task.status = 'Completed';
  task.completedAt = new Date();
  await task.save();
  await notificationService.create(userId, {
    title: 'Task completed',
    message: `"${task.title}" marked as completed.`,
    type: 'task_completed',
    taskId: task._id,
  });
  return task;
},
```

And update `changeStatus` similarly when transitioning to Completed:

```js
async changeStatus(userId, id, status) {
  const update = { status };
  if (status === 'Completed') update.completedAt = new Date();
  const task = await Task.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true });
  if (!task) throw notFound();
  if (status === 'Completed') {
    await notificationService.create(userId, {
      title: 'Task completed',
      message: `"${task.title}" marked as completed.`,
      type: 'task_completed',
      taskId: task._id,
    });
  }
  return task;
},
```

- [ ] **Step 4: Write `server/src/services/pomodoro.service.js`**

```js
import { PomodoroSession } from '../models/PomodoroSession.js';
import { Task } from '../models/Task.js';
import { taskService } from './task.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';

export const pomodoroService = {
  async create(userId, body) {
    if (body.taskId) {
      const owned = await Task.exists({ _id: body.taskId, userId });
      if (!owned) throw new AppError('Task not found', 403);
    }
    const session = await PomodoroSession.create({ ...body, userId });
    if (session.mode === 'Focus' && session.isCompleted) {
      await notificationService.create(userId, {
        title: 'Focus session complete',
        message: `Great job! ${session.durationMinutes} min focus done.`,
        type: 'pomodoro_done',
        taskId: session.taskId,
      });
      if (session.taskId) {
        await taskService.incrementPomodoro(userId, session.taskId.toString());
      }
    }
    return session;
  },

  async recent(userId, limit = 10) {
    return PomodoroSession.find({ userId }).sort({ startedAt: -1 }).limit(limit);
  },
};
```

- [ ] **Step 5: Write `server/src/controllers/pomodoro.controller.js`**

```js
import { pomodoroService } from '../services/pomodoro.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const pomodoroController = {
  create: asyncHandler(async (req, res) =>
    res.status(201).json(await pomodoroService.create(req.user.id, req.body)),
  ),
  recent: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json(await pomodoroService.recent(req.user.id, limit));
  }),
};
```

- [ ] **Step 6: Write `server/src/routes/pomodoro.routes.js`**

```js
import { Router } from 'express';
import { pomodoroController } from '../controllers/pomodoro.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { sessionCreateSchema } from '../validators/pomodoro.validator.js';

const router = Router();
router.use(authRequired);

router.post('/', validate({ body: sessionCreateSchema }), pomodoroController.create);
router.get('/recent', pomodoroController.recent);

export default router;
```

- [ ] **Step 7: Mount in `routes/index.js`**

```js
import pomodoroRoutes from './pomodoro.routes.js';
router.use('/pomodoro-sessions', pomodoroRoutes);
```

- [ ] **Step 8: Write `server/tests/pomodoro.test.js`**

```js
import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();
const futureISO = (d = 1) => new Date(Date.now() + d * 86_400_000).toISOString();

const baseTask = (over = {}) => ({
  title: 'Study',
  deadline: futureISO(2),
  priority: 'Medium',
  estimatedPomodoros: 2,
  ...over,
});

describe('Pomodoro sessions', () => {
  it('creates a Focus session and increments task pomodoros', async () => {
    const a = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask())).body;
    const startedAt = new Date(Date.now() - 25 * 60_000).toISOString();
    const endedAt = new Date().toISOString();
    const r = await a.post('/api/pomodoro-sessions').send({
      taskId: t._id,
      mode: 'Focus',
      durationMinutes: 25,
      startedAt,
      endedAt,
      isCompleted: true,
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
      taskId: t._id,
      mode: 'Focus',
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      isCompleted: true,
    });
    expect(r.status).toBe(403);
  });

  it('estimated_reached fires once when reaching estimate', async () => {
    const a = await createAuthedAgent(app);
    const t = (await a.post('/api/tasks').send(baseTask({ estimatedPomodoros: 1 }))).body;
    await a.post('/api/pomodoro-sessions').send({
      taskId: t._id,
      mode: 'Focus',
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      isCompleted: true,
    });
    // second focus should NOT create another estimated_reached
    await a.post('/api/pomodoro-sessions').send({
      taskId: t._id,
      mode: 'Focus',
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      isCompleted: true,
    });
    const list = await a.get('/api/notifications');
    const reached = list.body.filter((n) => n.type === 'estimated_reached');
    expect(reached).toHaveLength(1);
  });

  it('returns recent sessions', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/pomodoro-sessions').send({
      mode: 'Focus',
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      isCompleted: true,
    });
    const r = await a.get('/api/pomodoro-sessions/recent');
    expect(r.body).toHaveLength(1);
  });
});
```

- [ ] **Step 9: Run tests; confirm PASS**

```bash
npm test -- tests/pomodoro.test.js tests/tasks.test.js tests/notifications.test.js
# Expected: all green
```

- [ ] **Step 10: Commit**

```bash
git add server
git commit -m "feat(server): pomodoro sessions, increment task, notifications wired"
```

---

## Task 11: Dashboard endpoint + tests

**Files:**

- Create: `server/src/services/dashboard.service.js`
- Create: `server/src/controllers/dashboard.controller.js`
- Create: `server/src/routes/dashboard.routes.js`
- Modify: `server/src/routes/index.js`
- Create: `server/tests/dashboard.test.js`

- [ ] **Step 1: Write `server/src/services/dashboard.service.js`**

```js
import { Task } from '../models/Task.js';
import { PomodoroSession } from '../models/PomodoroSession.js';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import mongoose from 'mongoose';

const oid = (id) => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);

export const dashboardService = {
  async summary(userId, now = new Date()) {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sevenDaysAgo = startOfDay(subDays(now, 6));

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      todayPomodoros,
      todayFocusAgg,
      todayTasks,
      upcomingTasks,
      recentSessions,
      completionDocs,
    ] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'Completed' }),
      Task.countDocuments({ userId, status: 'InProgress' }),
      Task.countDocuments({ userId, status: { $ne: 'Completed' }, deadline: { $lt: now } }),
      PomodoroSession.countDocuments({
        userId,
        mode: 'Focus',
        isCompleted: true,
        startedAt: { $gte: todayStart, $lte: todayEnd },
      }),
      PomodoroSession.aggregate([
        {
          $match: {
            userId: oid(userId),
            mode: 'Focus',
            isCompleted: true,
            startedAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$durationMinutes' } } },
      ]),
      Task.find({
        userId,
        status: { $ne: 'Completed' },
        deadline: { $gte: todayStart, $lte: todayEnd },
      }).limit(10),
      Task.find({ userId, status: { $ne: 'Completed' }, deadline: { $gt: todayEnd } })
        .sort({ deadline: 1 })
        .limit(5),
      PomodoroSession.find({ userId }).sort({ startedAt: -1 }).limit(5),
      Task.aggregate([
        {
          $match: {
            userId: oid(userId),
            status: 'Completed',
            completedAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const completionMap = Object.fromEntries(completionDocs.map((d) => [d._id, d.count]));
    const completionChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(now, i), 'yyyy-MM-dd');
      completionChart.push({ date: d, count: completionMap[d] || 0 });
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      todayPomodoros,
      todayFocusMinutes: todayFocusAgg[0]?.total || 0,
      todayTasks,
      upcomingTasks,
      recentSessions,
      completionChart,
    };
  },
};
```

- [ ] **Step 2: Write `server/src/controllers/dashboard.controller.js`**

```js
import { dashboardService } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardController = {
  summary: asyncHandler(async (req, res) => res.json(await dashboardService.summary(req.user.id))),
};
```

- [ ] **Step 3: Write `server/src/routes/dashboard.routes.js`**

```js
import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authRequired);
router.get('/summary', dashboardController.summary);
export default router;
```

- [ ] **Step 4: Mount in `routes/index.js`**

```js
import dashboardRoutes from './dashboard.routes.js';
router.use('/dashboard', dashboardRoutes);
```

- [ ] **Step 5: Write `server/tests/dashboard.test.js`**

```js
import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();
const futureISO = (d = 1) => new Date(Date.now() + d * 86_400_000).toISOString();
const pastISO = (d = 1) => new Date(Date.now() - d * 86_400_000).toISOString();

describe('GET /api/dashboard/summary', () => {
  it('aggregates counts correctly', async () => {
    const a = await createAuthedAgent(app);
    await a
      .post('/api/tasks')
      .send({ title: 't1', deadline: futureISO(1), priority: 'Low', estimatedPomodoros: 1 });
    const t2 = await a
      .post('/api/tasks')
      .send({ title: 't2', deadline: futureISO(1), priority: 'Medium', estimatedPomodoros: 1 });
    await a.patch(`/api/tasks/${t2.body._id}/complete`);
    await a
      .post('/api/tasks')
      .send({ title: 'overdue', deadline: pastISO(1), priority: 'High', estimatedPomodoros: 1 });

    const r = await a.get('/api/dashboard/summary');
    expect(r.body.totalTasks).toBe(3);
    expect(r.body.completedTasks).toBe(1);
    expect(r.body.overdueTasks).toBe(1);
    expect(r.body.completionChart).toHaveLength(7);
  });
});
```

- [ ] **Step 6: Run tests**

```bash
npm test -- tests/dashboard.test.js
# Expected: passing
```

- [ ] **Step 7: Commit**

```bash
git add server
git commit -m "feat(server): dashboard summary endpoint with parallel aggregations"
```

---

## Task 12: Statistics endpoints + tests

**Files:**

- Create: `server/src/services/statistics.service.js`
- Create: `server/src/controllers/statistics.controller.js`
- Create: `server/src/routes/statistics.routes.js`
- Modify: `server/src/routes/index.js`
- Create: `server/tests/statistics.test.js`

- [ ] **Step 1: Write `server/src/services/statistics.service.js`**

```js
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { PomodoroSession } from '../models/PomodoroSession.js';
import { format, addDays, startOfDay } from 'date-fns';
import { parseStatRange } from '../utils/dateRange.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

function fillSeries(start, end, map, factory) {
  const out = [];
  let cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    const key = format(cur, 'yyyy-MM-dd');
    out.push({ date: key, ...factory(map[key]) });
    cur = addDays(cur, 1);
  }
  return out;
}

export const statisticsService = {
  async tasks(userId, range) {
    const { start, end } = parseStatRange(range);
    const docs = await Task.aggregate([
      {
        $match: {
          userId: oid(userId),
          status: 'Completed',
          completedAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
    ]);
    const map = Object.fromEntries(docs.map((d) => [d._id, d.count]));
    return fillSeries(start, end, map, (v) => ({ count: v || 0 }));
  },

  async pomodoros(userId, range) {
    const { start, end } = parseStatRange(range);
    const dailyDocs = await PomodoroSession.aggregate([
      {
        $match: {
          userId: oid(userId),
          mode: 'Focus',
          isCompleted: true,
          startedAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
          sessions: { $sum: 1 },
          focusMinutes: { $sum: '$durationMinutes' },
        },
      },
    ]);
    const map = Object.fromEntries(dailyDocs.map((d) => [d._id, d]));
    const daily = fillSeries(start, end, map, (v) => ({
      sessions: v?.sessions || 0,
      focusMinutes: v?.focusMinutes || 0,
    }));

    const byPriority = await Task.aggregate([
      { $match: { userId: oid(userId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { _id: 0, priority: '$_id', count: 1 } },
    ]);
    const byStatus = await Task.aggregate([
      { $match: { userId: oid(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);
    return { daily, byPriority, byStatus };
  },
};
```

- [ ] **Step 2: Write `server/src/controllers/statistics.controller.js`**

```js
import { statisticsService } from '../services/statistics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const statisticsController = {
  tasks: asyncHandler(async (req, res) =>
    res.json(await statisticsService.tasks(req.user.id, req.query.range)),
  ),
  pomodoros: asyncHandler(async (req, res) =>
    res.json(await statisticsService.pomodoros(req.user.id, req.query.range)),
  ),
};
```

- [ ] **Step 3: Write `server/src/routes/statistics.routes.js`**

```js
import { Router } from 'express';
import { statisticsController } from '../controllers/statistics.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authRequired);

router.get('/tasks', statisticsController.tasks);
router.get('/pomodoros', statisticsController.pomodoros);

export default router;
```

- [ ] **Step 4: Mount in `routes/index.js`**

```js
import statsRoutes from './statistics.routes.js';
router.use('/statistics', statsRoutes);
```

- [ ] **Step 5: Write `server/tests/statistics.test.js`**

```js
import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';

const app = buildApp();

describe('GET /api/statistics/*', () => {
  it('tasks series has 7 days for 7days range', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/statistics/tasks?range=7days');
    expect(r.body).toHaveLength(7);
    for (const d of r.body) expect(d).toHaveProperty('date');
  });

  it('pomodoros returns daily + byPriority + byStatus', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/statistics/pomodoros?range=30days');
    expect(r.body.daily).toHaveLength(30);
    expect(Array.isArray(r.body.byPriority)).toBe(true);
    expect(Array.isArray(r.body.byStatus)).toBe(true);
  });

  it('defaults to 7days when range missing', async () => {
    const a = await createAuthedAgent(app);
    const r = await a.get('/api/statistics/tasks');
    expect(r.body).toHaveLength(7);
  });
});
```

- [ ] **Step 6: Run tests**

```bash
npm test -- tests/statistics.test.js
# Expected: passing
```

- [ ] **Step 7: Commit**

```bash
git add server
git commit -m "feat(server): statistics endpoints (tasks/pomodoros) with date-filled series"
```

---

## Task 13: Cron jobs (overdueChecker, deadlineSoonReminder) + seed script

**Files:**

- Create: `server/src/jobs/{index.js,overdueChecker.js,deadlineSoonReminder.js}`
- Modify: `server/src/index.js`
- Create: `server/src/seed/seed.js`
- Add to `server/tests/notifications.test.js`: cron logic test by calling job functions directly

- [ ] **Step 1: Write `server/src/jobs/overdueChecker.js`**

```js
import { Task } from '../models/Task.js';
import { notificationService } from '../services/notification.service.js';

export async function runOverdueChecker(now = new Date()) {
  const tasks = await Task.find({
    status: { $ne: 'Completed' },
    deadline: { $lt: now },
  }).select('_id userId title');

  for (const task of tasks) {
    await notificationService.createDeduped(task.userId, {
      title: 'Task overdue',
      message: `"${task.title}" passed its deadline.`,
      type: 'task_overdue',
      taskId: task._id,
      withinMs: 24 * 60 * 60 * 1000,
    });
  }
  return tasks.length;
}
```

- [ ] **Step 2: Write `server/src/jobs/deadlineSoonReminder.js`**

```js
import { Task } from '../models/Task.js';
import { notificationService } from '../services/notification.service.js';

export async function runDeadlineSoonReminder(now = new Date()) {
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const tasks = await Task.find({
    status: { $ne: 'Completed' },
    deadline: { $gt: now, $lte: oneHourLater },
  }).select('_id userId title deadline');

  for (const task of tasks) {
    await notificationService.createDeduped(task.userId, {
      title: 'Deadline approaching',
      message: `"${task.title}" is due within the hour.`,
      type: 'deadline_soon',
      taskId: task._id,
      withinMs: 2 * 60 * 60 * 1000,
    });
  }
  return tasks.length;
}
```

- [ ] **Step 3: Write `server/src/jobs/index.js`**

```js
import cron from 'node-cron';
import { runOverdueChecker } from './overdueChecker.js';
import { runDeadlineSoonReminder } from './deadlineSoonReminder.js';

export function startCronJobs() {
  cron.schedule('*/5 * * * *', () => {
    runOverdueChecker().catch((err) => console.error('overdueChecker', err));
  });
  cron.schedule('*/15 * * * *', () => {
    runDeadlineSoonReminder().catch((err) => console.error('deadlineSoonReminder', err));
  });
  console.log('🕒 Cron jobs scheduled');
}
```

- [ ] **Step 4: Wire into `server/src/index.js`**

```js
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { buildApp } from './app.js';
import { startCronJobs } from './jobs/index.js';

async function bootstrap() {
  await connectDB();
  startCronJobs();
  const app = buildApp();
  app.listen(env.PORT, () => console.log(`🚀 Server on :${env.PORT}`));
}

bootstrap().catch((err) => {
  console.error('Boot failure', err);
  process.exit(1);
});
```

- [ ] **Step 5: Append cron logic tests to `server/tests/notifications.test.js`**

```js
import { runOverdueChecker } from '../src/jobs/overdueChecker.js';
import { runDeadlineSoonReminder } from '../src/jobs/deadlineSoonReminder.js';

describe('Cron job logic', () => {
  it('overdueChecker creates notification once per task', async () => {
    const a = await createAuthedAgent(app);
    await a.post('/api/tasks').send({
      title: 'past',
      deadline: new Date(Date.now() - 86_400_000).toISOString(),
      priority: 'High',
      estimatedPomodoros: 1,
    });
    const n1 = await runOverdueChecker();
    const n2 = await runOverdueChecker();
    expect(n1).toBe(1);
    expect(n2).toBe(1); // job sees same task, but dedup blocks 2nd notif
    const list = await a.get('/api/notifications');
    expect(list.body.filter((n) => n.type === 'task_overdue')).toHaveLength(1);
  });

  it('deadlineSoonReminder fires for tasks within next hour', async () => {
    const a = await createAuthedAgent(app);
    const inHalfHour = new Date(Date.now() + 30 * 60_000).toISOString();
    await a.post('/api/tasks').send({
      title: 'soon',
      deadline: inHalfHour,
      priority: 'High',
      estimatedPomodoros: 1,
    });
    await runDeadlineSoonReminder();
    const list = await a.get('/api/notifications');
    expect(list.body.some((n) => n.type === 'deadline_soon')).toBe(true);
  });
});
```

- [ ] **Step 6: Write `server/src/seed/seed.js`**

```js
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
      User.deleteMany({}),
      Task.deleteMany({}),
      PomodoroSession.deleteMany({}),
      UserSetting.deleteMany({}),
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
    email: 'demo@Task88.com',
    passwordHash,
  });
  await UserSetting.create({ userId: user._id });

  const taskSeeds = [
    {
      title: 'Finish Q2 report',
      deadline: daysFromNow(0),
      priority: 'High',
      status: 'Todo',
      estimatedPomodoros: 4,
      completedPomodoros: 1,
    },
    {
      title: 'Review chapter 5',
      deadline: daysFromNow(0),
      priority: 'Medium',
      status: 'InProgress',
      estimatedPomodoros: 3,
      completedPomodoros: 2,
    },
    {
      title: 'Prepare presentation',
      deadline: daysFromNow(2),
      priority: 'High',
      status: 'Todo',
      estimatedPomodoros: 6,
      completedPomodoros: 0,
    },
    {
      title: 'Practice coding',
      deadline: daysFromNow(3),
      priority: 'Low',
      status: 'Todo',
      estimatedPomodoros: 2,
      completedPomodoros: 0,
    },
    {
      title: 'Buy groceries',
      deadline: daysFromNow(-1),
      priority: 'Low',
      status: 'Todo',
      estimatedPomodoros: 1,
      completedPomodoros: 0,
    },
    {
      title: 'Send invoice',
      deadline: daysFromNow(-3),
      priority: 'Medium',
      status: 'Completed',
      estimatedPomodoros: 1,
      completedPomodoros: 1,
      completedAt: daysFromNow(-3),
    },
    {
      title: 'Read book chapter',
      deadline: daysFromNow(-5),
      priority: 'Low',
      status: 'Completed',
      estimatedPomodoros: 2,
      completedPomodoros: 2,
      completedAt: daysFromNow(-4),
    },
    {
      title: 'Refactor module',
      deadline: daysFromNow(-10),
      priority: 'High',
      status: 'Completed',
      estimatedPomodoros: 5,
      completedPomodoros: 5,
      completedAt: daysFromNow(-8),
    },
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
        startedAt,
        endedAt,
        isCompleted: true,
      });
    }
  }
  await PomodoroSession.insertMany(sessions);

  await Notification.insertMany([
    {
      userId: user._id,
      type: 'task_overdue',
      taskId: tasks[4]._id,
      title: 'Task overdue',
      message: '"Buy groceries" passed its deadline.',
      isRead: false,
    },
    {
      userId: user._id,
      type: 'task_completed',
      taskId: tasks[5]._id,
      title: 'Task completed',
      message: '"Send invoice" marked as completed.',
      isRead: true,
    },
    {
      userId: user._id,
      type: 'pomodoro_done',
      taskId: tasks[1]._id,
      title: 'Focus session complete',
      message: 'Great job! 25 min focus done.',
      isRead: false,
    },
  ]);

  console.log(
    `✅ Seeded user demo@Task88.com / 123456 with ${tasks.length} tasks, ${sessions.length} sessions, 3 notifications.`,
  );
  await disconnectDB();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 7: Run tests**

```bash
npm test
# Expected: all server tests green (auth, settings, tasks, pomodoro, dashboard, statistics, notifications + cron)
```

- [ ] **Step 8: Smoke-run seed (optional, requires running mongo)**

```bash
# Only if you have local mongo:
npm run seed:reset
# Expected: "✅ Seeded user demo@Task88.com / 123456 ..."
```

- [ ] **Step 9: Commit**

```bash
git add server
git commit -m "feat(server): cron jobs + seed script (demo user, 8 tasks, ~20 sessions, 3 notifications)"
```

---

## Task 14: Client scaffolding — Vite + TS + Tailwind + tokens + Router + React Query

**Files:**

- Create: `client/package.json`, `client/vite.config.ts`, `client/tsconfig.json`, `client/tsconfig.node.json`, `client/tailwind.config.js`, `client/postcss.config.js`, `client/.eslintrc.cjs`, `client/.prettierrc`, `client/.env.example`, `client/index.html`
- Create: `client/src/{main.tsx,App.tsx,index.css}`
- Create: `client/src/lib/queryClient.ts`
- Create: `client/src/store/{authStore.ts,themeStore.ts}`
- Create: `client/src/hooks/useTheme.ts`
- Create: `client/src/types/{auth,task,pomodoro,statistics,settings,notification}.ts`

- [ ] **Step 1: Scaffold Vite app**

From repo root:

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
```

- [ ] **Step 2: Install runtime + dev deps**

```bash
npm install react-router-dom @tanstack/react-query @tanstack/react-query-devtools \
  zustand axios react-hook-form zod @hookform/resolvers \
  recharts react-big-calendar date-fns sonner lucide-react clsx

npm install --save-dev tailwindcss@3 postcss autoprefixer prettier-plugin-tailwindcss \
  vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/ui
```

- [ ] **Step 3: Init Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Replace `client/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--text))',
          muted: 'rgb(var(--text-muted))',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
        },
        priority: { low: '#16a34a', medium: '#f59e0b', high: '#dc2626' },
        status: { todo: '#64748b', progress: '#2563eb', done: '#16a34a', overdue: '#dc2626' },
      },
      borderRadius: { '2xl': '16px', '3xl': '20px' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Replace `client/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

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

html,
body,
#root {
  height: 100%;
}
body {
  @apply bg-bg text-text font-sans antialiased;
}
```

- [ ] **Step 6: Replace `client/index.html`** body content (head only):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task88</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Replace `client/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 8: Update `client/tsconfig.json`** — set `paths` and strict:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 9: Create `client/src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 10: Create `client/.env.example`**

```
VITE_API_BASE_URL=/api
```

Then `cp .env.example .env`.

- [ ] **Step 11: Write all type files**

`client/src/types/auth.ts`:

```ts
export type User = { id: string; fullName: string; email: string };
export type AuthResponse = { token: string; user: User };
```

`client/src/types/task.ts`:

```ts
export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Todo' | 'InProgress' | 'Completed';

export type Task = {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  deadline: string; // ISO
  priority: Priority;
  status: TaskStatus;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
};

export type TaskListQuery = {
  search?: string;
  status?: TaskStatus;
  priority?: Priority;
  deadlineFilter?: 'today' | 'upcoming' | 'overdue' | 'completed';
  sortBy?: 'deadline' | 'priority' | 'newest';
};

export type TaskCreateInput = {
  title: string;
  description?: string;
  deadline: string;
  priority: Priority;
  estimatedPomodoros: number;
};
export type TaskUpdateInput = Partial<TaskCreateInput>;
```

`client/src/types/pomodoro.ts`:

```ts
export type PomodoroMode = 'Focus' | 'ShortBreak' | 'LongBreak';

export type PomodoroSession = {
  _id: string;
  userId: string;
  taskId: string | null;
  mode: PomodoroMode;
  durationMinutes: number;
  startedAt: string;
  endedAt?: string | null;
  isCompleted: boolean;
  createdAt: string;
};

export type PomodoroCreateInput = {
  taskId?: string | null;
  mode: PomodoroMode;
  durationMinutes: number;
  startedAt: string;
  endedAt: string;
  isCompleted: boolean;
};
```

`client/src/types/statistics.ts`:

```ts
export type DailyTaskPoint = { date: string; count: number };
export type DailyPomodoroPoint = { date: string; sessions: number; focusMinutes: number };
export type PriorityCount = { priority: 'Low' | 'Medium' | 'High'; count: number };
export type StatusCount = { status: 'Todo' | 'InProgress' | 'Completed'; count: number };

export type TaskStatsResponse = DailyTaskPoint[];
export type PomodoroStatsResponse = {
  daily: DailyPomodoroPoint[];
  byPriority: PriorityCount[];
  byStatus: StatusCount[];
};

export type StatRange = '7days' | '30days' | 'month';
```

`client/src/types/settings.ts`:

```ts
export type Settings = {
  _id: string;
  userId: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  theme: 'light' | 'dark';
  notificationEnabled: boolean;
};

export type SettingsUpdateInput = Partial<
  Pick<
    Settings,
    'focusDuration' | 'shortBreakDuration' | 'longBreakDuration' | 'theme' | 'notificationEnabled'
  >
>;
```

`client/src/types/notification.ts`:

```ts
export type NotificationType =
  | 'task_overdue'
  | 'task_completed'
  | 'pomodoro_done'
  | 'deadline_soon'
  | 'estimated_reached';

export type Notification = {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  taskId?: string | null;
  isRead: boolean;
  createdAt: string;
};
```

- [ ] **Step 12: Write `client/src/lib/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (n, err: any) => (err?.response?.status === 401 ? false : n < 2),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
```

- [ ] **Step 13: Write `client/src/store/themeStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'Task88-theme' },
  ),
);
```

- [ ] **Step 14: Write `client/src/hooks/useTheme.ts`**

```ts
import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return useThemeStore();
}
```

- [ ] **Step 15: Write `client/src/store/authStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';

type AuthState = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'Task88-auth' },
  ),
);
```

- [ ] **Step 16: Replace `client/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 17: Replace `client/src/App.tsx`** (placeholder router; expanded in Task 18)

```tsx
import { useTheme } from '@/hooks/useTheme';

export default function App() {
  useTheme();
  return (
    <div className="flex min-h-full items-center justify-center">
      <p className="text-text-muted">Task88 client booting…</p>
    </div>
  );
}
```

- [ ] **Step 18: Smoke check**

```bash
cd client && npm run dev
# Visit http://localhost:5173 — should show "Task88 client booting…"
# Stop with Ctrl+C
npm run build
# Expected: build succeeds
```

- [ ] **Step 19: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): scaffold Vite+React+TS+Tailwind with theme tokens, providers, types"
```

---

## Task 15: Client API layer + axios interceptors + queries hook scaffolding

**Files:**

- Create: `client/src/api/{axiosClient.ts,authApi.ts,taskApi.ts,pomodoroApi.ts,dashboardApi.ts,statisticsApi.ts,settingsApi.ts,notificationApi.ts}`
- Create: `client/src/hooks/queries/{useAuthQueries.ts,useTaskQueries.ts,usePomodoroQueries.ts,useDashboardQuery.ts,useStatisticsQueries.ts,useSettingsQueries.ts,useNotificationQueries.ts}`
- Create: `client/src/hooks/useAuth.ts`

- [ ] **Step 1: Write `client/src/api/axiosClient.ts`**

```ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
});

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url ?? '';
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      useAuthStore.getState().logout();
      queryClient.clear();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);
```

- [ ] **Step 2: Write API modules**

`client/src/api/authApi.ts`:

```ts
import { api } from './axiosClient';
import type { AuthResponse, User } from '@/types/auth';

export const authApi = {
  register: (body: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};
```

`client/src/api/taskApi.ts`:

```ts
import { api } from './axiosClient';
import type {
  Task,
  TaskCreateInput,
  TaskListQuery,
  TaskUpdateInput,
  TaskStatus,
} from '@/types/task';

export const taskApi = {
  list: (q: TaskListQuery = {}) => api.get<Task[]>('/tasks', { params: q }).then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (b: TaskCreateInput) => api.post<Task>('/tasks', b).then((r) => r.data),
  update: (id: string, b: TaskUpdateInput) => api.put<Task>(`/tasks/${id}`, b).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
  changeStatus: (id: string, status: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),
  markCompleted: (id: string) => api.patch<Task>(`/tasks/${id}/complete`).then((r) => r.data),
  incrementPomodoro: (id: string) =>
    api.patch<Task>(`/tasks/${id}/pomodoro/increment`).then((r) => r.data),
};
```

`client/src/api/pomodoroApi.ts`:

```ts
import { api } from './axiosClient';
import type { PomodoroSession, PomodoroCreateInput } from '@/types/pomodoro';

export const pomodoroApi = {
  create: (b: PomodoroCreateInput) =>
    api.post<PomodoroSession>('/pomodoro-sessions', b).then((r) => r.data),
  recent: (limit = 10) =>
    api
      .get<PomodoroSession[]>('/pomodoro-sessions/recent', { params: { limit } })
      .then((r) => r.data),
};
```

`client/src/api/dashboardApi.ts`:

```ts
import { api } from './axiosClient';

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
};
```

`client/src/api/statisticsApi.ts`:

```ts
import { api } from './axiosClient';
import type { StatRange, TaskStatsResponse, PomodoroStatsResponse } from '@/types/statistics';

export const statisticsApi = {
  tasks: (range: StatRange) =>
    api.get<TaskStatsResponse>('/statistics/tasks', { params: { range } }).then((r) => r.data),
  pomodoros: (range: StatRange) =>
    api
      .get<PomodoroStatsResponse>('/statistics/pomodoros', { params: { range } })
      .then((r) => r.data),
};
```

`client/src/api/settingsApi.ts`:

```ts
import { api } from './axiosClient';
import type { Settings, SettingsUpdateInput } from '@/types/settings';
import type { User } from '@/types/auth';

export const settingsApi = {
  get: () => api.get<Settings>('/settings').then((r) => r.data),
  update: (b: SettingsUpdateInput) => api.put<Settings>('/settings', b).then((r) => r.data),
  updateProfile: (b: { fullName: string }) =>
    api.put<User>('/settings/profile', b).then((r) => r.data),
  changePassword: (b: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put<{ ok: true }>('/settings/password', b).then((r) => r.data),
};
```

`client/src/api/notificationApi.ts`:

```ts
import { api } from './axiosClient';
import type { Notification } from '@/types/notification';

export const notificationApi = {
  list: () => api.get<Notification[]>('/notifications').then((r) => r.data),
  markRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch<{ count: number }>('/notifications/read-all').then((r) => r.data),
};
```

- [ ] **Step 3: Write query hooks**

`client/src/hooks/queries/useAuthQueries.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';

export function useMeQuery() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!token,
  });
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.token, data.user);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => login(data.token, data.user),
  });
}
```

`client/src/hooks/queries/useTaskQueries.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/api/taskApi';
import type {
  TaskCreateInput,
  TaskListQuery,
  TaskUpdateInput,
  TaskStatus,
  Task,
} from '@/types/task';

export function useTasksQuery(filters: TaskListQuery = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.list(filters),
  });
}

export function useTaskQuery(id: string | null) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskApi.get(id!),
    enabled: !!id,
  });
}

export function invalidateTaskGroups(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tasks'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['statistics'] });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: TaskCreateInput) => taskApi.create(b),
    onSuccess: () => invalidateTaskGroups(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TaskUpdateInput }) => taskApi.update(id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', vars.id] });
      invalidateTaskGroups(qc);
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snaps = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      snaps.forEach(([key, data]) => {
        if (Array.isArray(data))
          qc.setQueryData(
            key,
            data.filter((t) => t._id !== id),
          );
      });
      return { snaps };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snaps.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => invalidateTaskGroups(qc),
  });
}

export function useMarkComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskApi.markCompleted(id),
    onSuccess: () => {
      invalidateTaskGroups(qc);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useChangeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskApi.changeStatus(id, status),
    onSuccess: () => {
      invalidateTaskGroups(qc);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
```

`client/src/hooks/queries/usePomodoroQueries.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pomodoroApi } from '@/api/pomodoroApi';
import type { PomodoroCreateInput } from '@/types/pomodoro';

export function useRecentSessionsQuery() {
  return useQuery({ queryKey: ['pomodoros', 'recent'], queryFn: () => pomodoroApi.recent(10) });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: PomodoroCreateInput) => pomodoroApi.create(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pomodoros'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['statistics'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
```

`client/src/hooks/queries/useDashboardQuery.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboardApi';

export function useDashboardQuery() {
  return useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });
}
```

`client/src/hooks/queries/useStatisticsQueries.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '@/api/statisticsApi';
import type { StatRange } from '@/types/statistics';

export function useTaskStatsQuery(range: StatRange) {
  return useQuery({
    queryKey: ['statistics', 'tasks', range],
    queryFn: () => statisticsApi.tasks(range),
  });
}
export function usePomodoroStatsQuery(range: StatRange) {
  return useQuery({
    queryKey: ['statistics', 'pomodoros', range],
    queryFn: () => statisticsApi.pomodoros(range),
  });
}
```

`client/src/hooks/queries/useSettingsQueries.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settingsApi';
import type { SettingsUpdateInput } from '@/types/settings';
import { useAuthStore } from '@/store/authStore';

export function useSettingsQuery() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    enabled: !!token,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: SettingsUpdateInput) => settingsApi.update(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (b: { fullName: string }) => settingsApi.updateProfile(b),
    onSuccess: (user) => {
      setUser({
        id: (user as any)._id ?? (user as any).id,
        fullName: user.fullName,
        email: user.email,
      });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: settingsApi.changePassword,
  });
}
```

`client/src/hooks/queries/useNotificationQueries.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notificationApi';
import { useAuthStore } from '@/store/authStore';

export function useNotificationsQuery() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
```

- [ ] **Step 4: Write `client/src/hooks/useAuth.ts`**

```ts
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const { token, user, logout: storeLogout } = useAuthStore();
  const qc = useQueryClient();
  function logout() {
    storeLogout();
    qc.clear();
  }
  return { token, user, isAuthenticated: !!token, logout };
}
```

- [ ] **Step 5: Typecheck**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): API layer + React Query hooks + axios interceptors"
```

---

## Task 16: Pomodoro engine store + tests

**Files:**

- Create: `client/src/lib/audio.ts`
- Create: `client/src/store/pomodoroStore.ts`
- Create: `client/src/hooks/usePomodoroEngine.ts`
- Create: `client/src/utils/dateUtils.ts`
- Create: `client/src/utils/taskUtils.ts`
- Create: `client/src/utils/formatters.ts`
- Create: `client/src/store/__tests__/pomodoroStore.test.ts`
- Create: `client/src/utils/__tests__/taskUtils.test.ts`

- [ ] **Step 1: Write `client/src/lib/audio.ts`**

```ts
let audio: HTMLAudioElement | null = null;
let unlocked = false;

export function preloadAudio() {
  if (audio) return audio;
  audio = new Audio(
    'https://cdn.jsdelivr.net/gh/anars/blank-audio/250-milliseconds-of-silence.mp3',
  );
  audio.preload = 'auto';
  return audio;
}

export async function unlockAudio() {
  if (unlocked) return;
  const a = preloadAudio();
  try {
    await a.play();
    a.pause();
    a.currentTime = 0;
    unlocked = true;
  } catch {
    // user has not interacted yet
  }
}

export function playNotify() {
  const a = preloadAudio();
  a.currentTime = 0;
  a.play().catch(() => {});
}
```

- [ ] **Step 2: Write `client/src/utils/dateUtils.ts`**

```ts
import { format, formatDistanceToNow } from 'date-fns';

export const formatDateTime = (iso: string) => format(new Date(iso), 'MMM d, HH:mm');
export const formatDate = (iso: string) => format(new Date(iso), 'MMM d');
export const fromNow = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });
export const minutesToHM = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
};
```

- [ ] **Step 3: Write `client/src/utils/taskUtils.ts`**

```ts
import type { Priority, Task, TaskStatus } from '@/types/task';

export const priorityColor: Record<Priority, string> = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
};

export const statusBadgeText: Record<TaskStatus, string> = {
  Todo: 'To do',
  InProgress: 'In progress',
  Completed: 'Completed',
};

export const isOverdue = (t: Pick<Task, 'deadline' | 'status'>): boolean =>
  new Date(t.deadline) < new Date() && t.status !== 'Completed';

export const priorityRank: Record<Priority, number> = { Low: 1, Medium: 2, High: 3 };
```

- [ ] **Step 4: Write `client/src/utils/formatters.ts`**

```ts
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
```

- [ ] **Step 5: Write `client/src/store/pomodoroStore.ts`**

```ts
import { create } from 'zustand';
import type { PomodoroMode } from '@/types/pomodoro';
import { pomodoroApi } from '@/api/pomodoroApi';
import { queryClient } from '@/lib/queryClient';
import { playNotify } from '@/lib/audio';

type Status = 'idle' | 'running' | 'paused';

type Durations = { focus: number; shortBreak: number; longBreak: number };

type State = {
  mode: PomodoroMode;
  status: Status;
  durations: Durations;
  endsAt: number | null;
  remainingMs: number;
  startedAt: Date | null;
  selectedTaskId: string | null;
  intervalId: number | null;
  focusCount: number;
  // pending suggestion: when set, UI may show "task estimate reached" prompt
  estimateReachedTaskId: string | null;

  hydrateFromSettings: (s: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  }) => void;
  setMode: (m: PomodoroMode) => void;
  selectTask: (id: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  acknowledgeEstimate: () => void;
};

const minutesMs = (m: number) => m * 60_000;

const durationFor = (state: Pick<State, 'mode' | 'durations'>) => {
  switch (state.mode) {
    case 'Focus':
      return state.durations.focus;
    case 'ShortBreak':
      return state.durations.shortBreak;
    case 'LongBreak':
      return state.durations.longBreak;
  }
};

export const usePomodoroStore = create<State>((set, get) => {
  function clearTick() {
    const { intervalId } = get();
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      set({ intervalId: null });
    }
  }

  function tick() {
    const { endsAt } = get();
    if (endsAt === null) return;
    if (Date.now() >= endsAt) complete();
  }

  async function complete() {
    clearTick();
    const { mode, durations, startedAt, selectedTaskId, focusCount } = get();
    if (mode === 'Focus' && startedAt) {
      const newCount = focusCount + 1;
      try {
        await pomodoroApi.create({
          taskId: selectedTaskId,
          mode: 'Focus',
          durationMinutes: durations.focus,
          startedAt: startedAt.toISOString(),
          endedAt: new Date().toISOString(),
          isCompleted: true,
        });
        queryClient.invalidateQueries({ queryKey: ['pomodoros'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['statistics'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (e) {
        // intentionally swallow — UI shows toast in caller
      }
      const nextMode: PomodoroMode = newCount % 4 === 0 ? 'LongBreak' : 'ShortBreak';
      set({
        focusCount: newCount,
        status: 'idle',
        endsAt: null,
        startedAt: null,
        mode: nextMode,
        remainingMs: minutesMs(
          nextMode === 'ShortBreak' ? durations.shortBreak : durations.longBreak,
        ),
        estimateReachedTaskId: selectedTaskId,
      });
    } else {
      set({
        status: 'idle',
        endsAt: null,
        mode: 'Focus',
        remainingMs: minutesMs(durations.focus),
      });
    }
    playNotify();
  }

  return {
    mode: 'Focus',
    status: 'idle',
    durations: { focus: 25, shortBreak: 5, longBreak: 15 },
    endsAt: null,
    remainingMs: 25 * 60_000,
    startedAt: null,
    selectedTaskId: null,
    intervalId: null,
    focusCount: 0,
    estimateReachedTaskId: null,

    hydrateFromSettings: ({ focusDuration, shortBreakDuration, longBreakDuration }) => {
      const durations = {
        focus: focusDuration,
        shortBreak: shortBreakDuration,
        longBreak: longBreakDuration,
      };
      set({ durations });
      if (get().status === 'idle')
        set({ remainingMs: minutesMs(durationFor({ mode: get().mode, durations })) });
    },

    setMode: (m) => {
      const { status } = get();
      if (status !== 'idle') return; // caller should have confirmed first
      const dur = durationFor({ mode: m, durations: get().durations });
      set({ mode: m, remainingMs: minutesMs(dur) });
    },

    selectTask: (id) => set({ selectedTaskId: id }),

    start: () => {
      const { status, mode, durations, remainingMs } = get();
      if (status === 'running') return;
      const ms = status === 'paused' ? remainingMs : minutesMs(durationFor({ mode, durations }));
      const endsAt = Date.now() + ms;
      const startedAt = mode === 'Focus' && status === 'idle' ? new Date() : get().startedAt;
      set({ status: 'running', endsAt, startedAt });
      const id = window.setInterval(tick, 250);
      set({ intervalId: id });
    },

    pause: () => {
      const { endsAt, status } = get();
      if (status !== 'running' || endsAt === null) return;
      const remainingMs = Math.max(0, endsAt - Date.now());
      clearTick();
      set({ status: 'paused', endsAt: null, remainingMs });
    },

    reset: () => {
      clearTick();
      const { mode, durations } = get();
      set({
        status: 'idle',
        endsAt: null,
        startedAt: null,
        remainingMs: minutesMs(durationFor({ mode, durations })),
      });
    },

    skip: () => {
      clearTick();
      const { mode, durations, focusCount } = get();
      const nextMode: PomodoroMode =
        mode === 'Focus' ? ((focusCount + 1) % 4 === 0 ? 'LongBreak' : 'ShortBreak') : 'Focus';
      const nextFocusCount = mode === 'Focus' ? focusCount + 1 : focusCount;
      set({
        status: 'idle',
        endsAt: null,
        startedAt: null,
        mode: nextMode,
        focusCount: nextFocusCount,
        remainingMs: minutesMs(durationFor({ mode: nextMode, durations })),
      });
    },

    acknowledgeEstimate: () => set({ estimateReachedTaskId: null }),
  };
});
```

- [ ] **Step 6: Write `client/src/hooks/usePomodoroEngine.ts`**

```ts
import { useEffect, useState } from 'react';
import { usePomodoroStore } from '@/store/pomodoroStore';

export function useRemainingMs() {
  const status = usePomodoroStore((s) => s.status);
  const endsAt = usePomodoroStore((s) => s.endsAt);
  const remainingMs = usePomodoroStore((s) => s.remainingMs);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [status]);

  if (status === 'running' && endsAt !== null) {
    return Math.max(0, endsAt - Date.now());
  }
  return remainingMs;
}
```

- [ ] **Step 7: Write tests `client/src/store/__tests__/pomodoroStore.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoroStore } from '@/store/pomodoroStore';

vi.mock('@/api/pomodoroApi', () => ({
  pomodoroApi: { create: vi.fn().mockResolvedValue({}), recent: vi.fn() },
}));
vi.mock('@/lib/audio', () => ({
  playNotify: vi.fn(),
  preloadAudio: vi.fn(),
  unlockAudio: vi.fn(),
}));
vi.mock('@/lib/queryClient', () => ({ queryClient: { invalidateQueries: vi.fn() } }));

const reset = () =>
  usePomodoroStore.setState({
    mode: 'Focus',
    status: 'idle',
    durations: { focus: 25, shortBreak: 5, longBreak: 15 },
    endsAt: null,
    remainingMs: 25 * 60_000,
    startedAt: null,
    selectedTaskId: null,
    intervalId: null,
    focusCount: 0,
    estimateReachedTaskId: null,
  });

beforeEach(() => {
  vi.useFakeTimers();
  reset();
});

describe('pomodoroStore', () => {
  it('start sets endsAt and running', () => {
    const before = Date.now();
    usePomodoroStore.getState().start();
    const s = usePomodoroStore.getState();
    expect(s.status).toBe('running');
    expect(s.endsAt).toBeGreaterThanOrEqual(before + 25 * 60_000 - 5);
  });

  it('pause preserves remainingMs and resume continues', () => {
    usePomodoroStore.getState().start();
    vi.advanceTimersByTime(60_000);
    usePomodoroStore.getState().pause();
    const remaining = usePomodoroStore.getState().remainingMs;
    expect(remaining).toBeLessThanOrEqual(24 * 60_000 + 100);
    expect(remaining).toBeGreaterThan(23 * 60_000);
    usePomodoroStore.getState().start();
    expect(usePomodoroStore.getState().status).toBe('running');
  });

  it('hydrateFromSettings updates durations and remainingMs when idle', () => {
    usePomodoroStore.getState().hydrateFromSettings({
      focusDuration: 50,
      shortBreakDuration: 10,
      longBreakDuration: 20,
    });
    expect(usePomodoroStore.getState().durations.focus).toBe(50);
    expect(usePomodoroStore.getState().remainingMs).toBe(50 * 60_000);
  });

  it('reset returns to idle with full remaining', () => {
    usePomodoroStore.getState().start();
    vi.advanceTimersByTime(120_000);
    usePomodoroStore.getState().reset();
    const s = usePomodoroStore.getState();
    expect(s.status).toBe('idle');
    expect(s.remainingMs).toBe(25 * 60_000);
  });

  it('skip on Focus increments focusCount and switches mode', () => {
    usePomodoroStore.getState().skip();
    const s = usePomodoroStore.getState();
    expect(s.focusCount).toBe(1);
    expect(s.mode).toBe('ShortBreak');
  });
});
```

- [ ] **Step 8: Write tests `client/src/utils/__tests__/taskUtils.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { isOverdue, priorityRank } from '@/utils/taskUtils';

describe('taskUtils', () => {
  it('isOverdue true when deadline past and not Completed', () => {
    expect(isOverdue({ deadline: new Date(Date.now() - 1000).toISOString(), status: 'Todo' })).toBe(
      true,
    );
  });
  it('isOverdue false when status is Completed', () => {
    expect(
      isOverdue({ deadline: new Date(Date.now() - 1000).toISOString(), status: 'Completed' }),
    ).toBe(false);
  });
  it('isOverdue false when deadline future', () => {
    expect(
      isOverdue({ deadline: new Date(Date.now() + 60_000).toISOString(), status: 'Todo' }),
    ).toBe(false);
  });
  it('priorityRank ordering', () => {
    expect(priorityRank.High).toBeGreaterThan(priorityRank.Medium);
    expect(priorityRank.Medium).toBeGreaterThan(priorityRank.Low);
  });
});
```

- [ ] **Step 9: Run tests**

```bash
cd client && npm test
# Expected: 9+ passing
```

- [ ] **Step 10: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): pomodoro engine store with endsAt timing + tests"
```

---

## Task 17: Common UI primitives + utility cn()

**Files:**

- Create: `client/src/utils/cn.ts`
- Create: `client/src/components/common/{Button,Input,Select,Textarea,Modal,Card,Badge,EmptyState,Loading,ErrorState,ConfirmDialog}.tsx`

- [ ] **Step 1: Write `client/src/utils/cn.ts`**

```ts
import clsx, { type ClassValue } from 'clsx';
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
```

- [ ] **Step 2: Write `client/src/components/common/Button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-surface text-text border border-border hover:bg-bg',
  ghost: 'bg-transparent text-text hover:bg-surface',
  danger: 'bg-priority-high text-white hover:opacity-90',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    fullWidth,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});
```

- [ ] **Step 3: Write `client/src/components/common/Input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const inputId = id ?? `i-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'block w-full rounded-2xl border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text-muted',
          error
            ? 'border-priority-high focus:border-priority-high'
            : 'border-border focus:border-primary-500',
          className,
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-priority-high">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
```

- [ ] **Step 4: Write `client/src/components/common/Select.tsx`**

```tsx
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Option = { value: string; label: string };
type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Option[];
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, options, className, id, ...rest },
  ref,
) {
  const sid = id ?? `s-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={sid} className="text-sm font-medium">
          {label}
        </label>
      )}
      <select
        id={sid}
        ref={ref}
        className={cn(
          'block w-full rounded-2xl border bg-surface px-3 py-2 text-sm outline-none',
          error ? 'border-priority-high' : 'border-border focus:border-primary-500',
          className,
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-priority-high">{error}</p>}
    </div>
  );
});
```

- [ ] **Step 5: Write `client/src/components/common/Textarea.tsx`**

```tsx
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, className, id, ...rest },
  ref,
) {
  const tid = id ?? `t-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={tid} className="text-sm font-medium">
          {label}
        </label>
      )}
      <textarea
        id={tid}
        ref={ref}
        rows={4}
        className={cn(
          'block w-full rounded-2xl border bg-surface px-3 py-2 text-sm outline-none',
          error ? 'border-priority-high' : 'border-border focus:border-primary-500',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-priority-high">{error}</p>}
    </div>
  );
});
```

- [ ] **Step 6: Write `client/src/components/common/Modal.tsx`**

```tsx
import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

type Size = 'sm' | 'md' | 'lg';
type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: Size;
  children: ReactNode;
};

const sizes: Record<Size, string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

export function Modal({ open, onClose, title, size = 'md', children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn('w-full rounded-3xl bg-surface p-6 shadow-md', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-2xl p-1 hover:bg-bg">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write `client/src/components/common/Card.tsx`**

```tsx
import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Props = HTMLAttributes<HTMLDivElement> & { padded?: boolean };

export function Card({ className, padded = true, ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-surface shadow-sm',
        padded && 'p-5',
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 8: Write `client/src/components/common/Badge.tsx`**

```tsx
import type { Priority, TaskStatus } from '@/types/task';
import { cn } from '@/utils/cn';

const priorityClass: Record<Priority, string> = {
  Low: 'bg-priority-low/15 text-priority-low',
  Medium: 'bg-priority-medium/15 text-priority-medium',
  High: 'bg-priority-high/15 text-priority-high',
};
const statusClass: Record<TaskStatus, string> = {
  Todo: 'bg-status-todo/15 text-status-todo',
  InProgress: 'bg-status-progress/15 text-status-progress',
  Completed: 'bg-status-done/15 text-status-done',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        priorityClass[priority],
      )}
    >
      {priority}
    </span>
  );
}
export function StatusBadge({ status }: { status: TaskStatus }) {
  const label = status === 'InProgress' ? 'In progress' : status;
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        statusClass[status],
      )}
    >
      {label}
    </span>
  );
}
export function OverdueBadge() {
  return (
    <span className="inline-flex rounded-full bg-status-overdue/15 px-2 py-0.5 text-xs font-medium text-status-overdue">
      Overdue
    </span>
  );
}
```

- [ ] **Step 9: Write `client/src/components/common/EmptyState.tsx`**

```tsx
import { type ReactNode } from 'react';

type Props = { icon?: ReactNode; title: string; description?: string; action?: ReactNode };

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      {icon && <div className="text-text-muted">{icon}</div>}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
```

- [ ] **Step 10: Write `client/src/components/common/Loading.tsx`**

```tsx
import { Loader2 } from 'lucide-react';

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-text-muted">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label ?? 'Loading…'}</span>
    </div>
  );
}

export function CardSkeleton() {
  return <div className="h-32 animate-pulse rounded-3xl bg-surface border border-border" />;
}
```

- [ ] **Step 11: Write `client/src/components/common/ErrorState.tsx`**

```tsx
import { Button } from './Button';

type Props = { title?: string; description?: string; onRetry?: () => void };

export function ErrorState({ title = 'Something went wrong', description, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <h3 className="text-sm font-semibold text-priority-high">{title}</h3>
      {description && <p className="max-w-sm text-sm text-text-muted">{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 12: Write `client/src/components/common/ConfirmDialog.tsx`**

```tsx
import { Modal } from './Modal';
import { Button } from './Button';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  danger?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  danger,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="text-sm text-text-muted">{description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 13: Typecheck**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 14: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): common UI primitives (Button, Input, Modal, Card, Badge, etc.)"
```

---

## Task 18: Routing + AppLayout (Sidebar, Header, ProtectedRoute) + Login + Register

**Files:**

- Create: `client/src/routes/{AppRouter.tsx,ProtectedRoute.tsx,PublicOnlyRoute.tsx}`
- Create: `client/src/components/layout/{AppLayout.tsx,Sidebar.tsx,Header.tsx,ThemeToggle.tsx}`
- Create: `client/src/validators/auth.schema.ts`
- Create: `client/src/pages/{LoginPage.tsx,RegisterPage.tsx,DashboardPage.tsx,TasksPage.tsx,PomodoroPage.tsx,CalendarPage.tsx,StatisticsPage.tsx,SettingsPage.tsx,NotFoundPage.tsx}` (placeholders for 6 of them, full Login + Register here)
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Write `client/src/routes/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}
```

- [ ] **Step 2: Write `client/src/routes/PublicOnlyRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function PublicOnlyRoute() {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

- [ ] **Step 3: Write all page placeholders** (full Login + Register; the rest are stubs)

`client/src/pages/DashboardPage.tsx`:

```tsx
export default function DashboardPage() {
  return <div>Dashboard (Task 19)</div>;
}
```

`client/src/pages/TasksPage.tsx`, `PomodoroPage.tsx`, `CalendarPage.tsx`, `StatisticsPage.tsx`, `SettingsPage.tsx`: same stub pattern with own page name.

`client/src/pages/NotFoundPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-text-muted">Page not found.</p>
      <Link to="/dashboard" className="text-primary-600 hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Write `client/src/validators/auth.schema.ts`**

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Required').max(100),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterValues = z.infer<typeof registerSchema>;
```

- [ ] **Step 5: Write `client/src/pages/LoginPage.tsx`**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, type LoginValues } from '@/validators/auth.schema';
import { useLogin } from '@/hooks/queries/useAuthQueries';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const login = useLogin();
  const navigate = useNavigate();

  const onSubmit = (v: LoginValues) =>
    login.mutate(v, {
      onSuccess: (data) => {
        toast.success(`Welcome back, ${data.user.fullName.split(' ')[0]}`);
        navigate('/dashboard');
      },
      onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Login failed'),
    });

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-primary-50 to-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Task88</h1>
          <p className="text-sm text-text-muted">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" fullWidth loading={login.isPending}>
            Log in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          New here?{' '}
          <Link to="/register" className="text-primary-600 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write `client/src/pages/RegisterPage.tsx`**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { registerSchema, type RegisterValues } from '@/validators/auth.schema';
import { useRegister } from '@/hooks/queries/useAuthQueries';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });
  const reg = useRegister();
  const navigate = useNavigate();

  const onSubmit = (v: RegisterValues) =>
    reg.mutate(v, {
      onSuccess: () => {
        toast.success('Account created');
        navigate('/dashboard');
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.error?.message ?? 'Registration failed'),
    });

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-primary-50 to-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">Create account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" {...register('fullName')} error={errors.fullName?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Confirm password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" fullWidth loading={reg.isPending}>
            Sign up
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write `client/src/components/layout/ThemeToggle.tsx`**

```tsx
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-2xl p-2 text-text-muted hover:bg-bg"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
```

- [ ] **Step 8: Write `client/src/components/layout/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  Calendar,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Timer className="h-6 w-6 text-primary-600" />
        <span className="text-lg font-semibold">Task88</span>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10'
                  : 'text-text hover:bg-bg',
              )
            }
          >
            <it.icon className="h-4 w-4" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-text-muted hover:bg-bg"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}
```

- [ ] **Step 9: Write `client/src/components/layout/Header.tsx`** (NotificationBell stub here, real impl Task 23)

```tsx
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { getInitials } from '@/utils/formatters';
import { useState } from 'react';

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'My Tasks',
  '/pomodoro': 'Pomodoro',
  '/calendar': 'Calendar',
  '/statistics': 'Statistics',
  '/settings': 'Settings',
};

export function Header({ onAddTask, onMenu }: { onAddTask?: () => void; onMenu?: () => void }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [, setOpen] = useState(false);
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        {onMenu && (
          <button
            onClick={onMenu}
            className="rounded-2xl p-2 hover:bg-bg lg:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}
        <h1 className="text-lg font-semibold">{titleMap[pathname] ?? ''}</h1>
      </div>
      <div className="flex items-center gap-2">
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="hidden rounded-2xl bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:inline-flex"
          >
            + Add Task
          </button>
        )}
        {/* Notification bell mounted in Task 25 */}
        <ThemeToggle />
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700"
          aria-label="User menu"
        >
          {user ? getInitials(user.fullName) : '?'}
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 10: Write `client/src/components/layout/AppLayout.tsx`**

```tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useMeQuery } from '@/hooks/queries/useAuthQueries';
import { useAuthStore } from '@/store/authStore';
import { useSettingsQuery } from '@/hooks/queries/useSettingsQueries';
import { useThemeStore } from '@/store/themeStore';
import { usePomodoroStore } from '@/store/pomodoroStore';

export default function AppLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const { data: me, isError } = useMeQuery();
  const { data: settings } = useSettingsQuery();
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = usePomodoroStore((s) => s.hydrateFromSettings);
  const navigate = useNavigate();
  const loc = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);
  useEffect(() => {
    if (isError) navigate('/login');
  }, [isError, navigate]);
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      hydrate({
        focusDuration: settings.focusDuration,
        shortBreakDuration: settings.shortBreakDuration,
        longBreakDuration: settings.longBreakDuration,
      });
    }
  }, [settings, setTheme, hydrate]);
  useEffect(() => {
    setDrawerOpen(false);
  }, [loc.pathname]);

  return (
    <div className="flex h-full">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <Header onMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Write `client/src/routes/AppRouter.tsx`**

```tsx
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Loading } from '@/components/common/Loading';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const PomodoroPage = lazy(() => import('@/pages/PomodoroPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function AppRouter() {
  return (
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
```

- [ ] **Step 12: Replace `client/src/App.tsx`**

```tsx
import { useTheme } from '@/hooks/useTheme';
import AppRouter from '@/routes/AppRouter';

export default function App() {
  useTheme();
  return <AppRouter />;
}
```

- [ ] **Step 13: Smoke check + typecheck**

```bash
cd client && npx tsc --noEmit && npm run build
# Expected: 0 errors, build succeeds
```

- [ ] **Step 14: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): routing + AppLayout (Sidebar/Header/ThemeToggle) + Login/Register"
```

---

## Task 19: Tasks Page (list/grid, filters, modal form, optimistic delete)

**Files:**

- Create: `client/src/validators/task.schema.ts`
- Create: `client/src/components/tasks/{TaskCard.tsx,TaskRow.tsx,TaskList.tsx,TaskFilters.tsx,TaskFormModal.tsx,TaskDetailModal.tsx}`
- Create: `client/src/hooks/useDebounce.ts`
- Replace: `client/src/pages/TasksPage.tsx`
- Modify: `client/src/components/layout/Header.tsx` (wire `onAddTask` from page via context — using a lightweight Zustand `uiStore` is overkill; instead use a custom event or render the button only inside the page. We'll move the `+ Add Task` button INTO the Tasks page header itself for simplicity. The header keeps the global one, calling a no-op when no handler.)

- [ ] **Step 1: Write `client/src/hooks/useDebounce.ts`**

```ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, set] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => set(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

- [ ] **Step 2: Write `client/src/validators/task.schema.ts`**

```ts
import { z } from 'zod';

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  deadline: z.string().min(1, 'Deadline required'), // datetime-local string
  priority: z.enum(['Low', 'Medium', 'High']),
  estimatedPomodoros: z.coerce.number().int().min(1, 'At least 1'),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
```

- [ ] **Step 3: Write `client/src/components/tasks/TaskFormModal.tsx`**

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { taskFormSchema, type TaskFormValues } from '@/validators/task.schema';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { useCreateTask, useUpdateTask } from '@/hooks/queries/useTaskQueries';
import type { Task } from '@/types/task';

type Props = {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
};

export function TaskFormModal({ open, onClose, task }: Props) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const isEdit = !!task;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      priority: 'Medium',
      estimatedPomodoros: 1,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              title: task.title,
              description: task.description ?? '',
              deadline: toLocalInput(task.deadline),
              priority: task.priority,
              estimatedPomodoros: task.estimatedPomodoros,
            }
          : {
              title: '',
              description: '',
              deadline: toLocalInput(new Date(new Date().setHours(23, 59, 0, 0)).toISOString()),
              priority: 'Medium',
              estimatedPomodoros: 1,
            },
      );
    }
  }, [open, task, reset]);

  const onSubmit = (v: TaskFormValues) => {
    const body = {
      ...v,
      description: v.description ?? '',
      deadline: new Date(v.deadline).toISOString(),
    };
    const success = (msg: string) => () => {
      toast.success(msg);
      onClose();
    };
    const fail = (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Save failed');
    if (isEdit && task)
      update.mutate({ id: task._id, body }, { onSuccess: success('Task updated'), onError: fail });
    else create.mutate(body, { onSuccess: success('Task created'), onError: fail });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit task' : 'New task'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Title" {...register('title')} error={errors.title?.message} />
        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
        />
        <Input
          label="Deadline"
          type="datetime-local"
          {...register('deadline')}
          error={errors.deadline?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select
              className="mt-1 block w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
              {...register('priority')}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <Input
            label="Est. Pomodoros"
            type="number"
            min={1}
            {...register('estimatedPomodoros')}
            error={errors.estimatedPomodoros?.message}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Write `client/src/components/tasks/TaskCard.tsx`**

```tsx
import { Check, Clock, Edit2, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { OverdueBadge, PriorityBadge, StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDateTime } from '@/utils/dateUtils';

type Props = {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onComplete: (t: Task) => void;
  onClick?: (t: Task) => void;
};

export function TaskCard({ task, onEdit, onDelete, onComplete, onClick }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onClick?.(task)} className="flex-1 text-left">
          <h3 className="line-clamp-1 text-sm font-semibold">{task.title}</h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-text-muted">{task.description}</p>
          )}
        </button>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDateTime(task.deadline)}</span>
        <span>·</span>
        <span>
          ⏱ {task.completedPomodoros}/{task.estimatedPomodoros}
        </span>
        <StatusBadge status={task.status} />
        {task.isOverdue && <OverdueBadge />}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {task.status !== 'Completed' && (
          <Button
            size="sm"
            variant="secondary"
            icon={<Check className="h-4 w-4" />}
            onClick={() => onComplete(task)}
          >
            Complete
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={<Edit2 className="h-4 w-4" />}
          onClick={() => onEdit(task)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => onDelete(task)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Write `client/src/components/tasks/TaskRow.tsx`**

```tsx
import { Check, Edit2, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';
import { OverdueBadge, PriorityBadge, StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDateTime } from '@/utils/dateUtils';

type Props = {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onComplete: (t: Task) => void;
};

export function TaskRow({ task, onEdit, onDelete, onComplete }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-medium">{task.title}</h4>
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.isOverdue && <OverdueBadge />}
        </div>
        <div className="mt-1 text-xs text-text-muted">
          {formatDateTime(task.deadline)} · ⏱ {task.completedPomodoros}/{task.estimatedPomodoros}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {task.status !== 'Completed' && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Check className="h-4 w-4" />}
            onClick={() => onComplete(task)}
            aria-label="Complete"
          />
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={<Edit2 className="h-4 w-4" />}
          onClick={() => onEdit(task)}
          aria-label="Edit"
        />
        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => onDelete(task)}
          aria-label="Delete"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write `client/src/components/tasks/TaskFilters.tsx`**

```tsx
import { Search } from 'lucide-react';
import { Input } from '@/components/common/Input';
import type { TaskListQuery } from '@/types/task';

type Props = {
  filters: TaskListQuery;
  onChange: (next: TaskListQuery) => void;
  view: 'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
};

export function TaskFilters({ filters, onChange, view, onViewChange }: Props) {
  const set = (patch: Partial<TaskListQuery>) => onChange({ ...filters, ...patch });
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-full sm:w-64">
        <Input
          label="Search"
          placeholder="Search by title…"
          value={filters.search ?? ''}
          onChange={(e) => set({ search: e.target.value || undefined })}
        />
        <Search className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-text-muted" />
      </div>
      <Select
        label="Status"
        value={filters.status ?? ''}
        onChange={(v) => set({ status: (v || undefined) as any })}
        options={[
          ['', 'All'],
          ['Todo', 'Todo'],
          ['InProgress', 'In progress'],
          ['Completed', 'Completed'],
        ]}
      />
      <Select
        label="Priority"
        value={filters.priority ?? ''}
        onChange={(v) => set({ priority: (v || undefined) as any })}
        options={[
          ['', 'All'],
          ['Low', 'Low'],
          ['Medium', 'Medium'],
          ['High', 'High'],
        ]}
      />
      <Select
        label="Deadline"
        value={filters.deadlineFilter ?? ''}
        onChange={(v) => set({ deadlineFilter: (v || undefined) as any })}
        options={[
          ['', 'All'],
          ['today', 'Today'],
          ['upcoming', 'Upcoming'],
          ['overdue', 'Overdue'],
          ['completed', 'Completed'],
        ]}
      />
      <Select
        label="Sort"
        value={filters.sortBy ?? 'deadline'}
        onChange={(v) => set({ sortBy: v as any })}
        options={[
          ['deadline', 'Deadline'],
          ['priority', 'Priority'],
          ['newest', 'Newest'],
        ]}
      />
      <div className="ml-auto inline-flex rounded-2xl border border-border bg-surface p-0.5">
        <button
          onClick={() => onViewChange('grid')}
          className={`rounded-xl px-3 py-1.5 text-xs ${view === 'grid' ? 'bg-primary-50 text-primary-700' : 'text-text-muted'}`}
        >
          Grid
        </button>
        <button
          onClick={() => onViewChange('list')}
          className={`rounded-xl px-3 py-1.5 text-xs ${view === 'list' ? 'bg-primary-50 text-primary-700' : 'text-text-muted'}`}
        >
          List
        </button>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 7: Write `client/src/pages/TasksPage.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/common/Button';
import { Loading, CardSkeleton } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { useTasksQuery, useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { useDebounce } from '@/hooks/useDebounce';
import type { Task, TaskListQuery } from '@/types/task';

export default function TasksPage() {
  const [rawFilters, setRawFilters] = useState<TaskListQuery>({ sortBy: 'deadline' });
  const debouncedSearch = useDebounce(rawFilters.search, 300);
  const filters = useMemo(
    () => ({ ...rawFilters, search: debouncedSearch }),
    [rawFilters, debouncedSearch],
  );
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  const tasks = useTasksQuery(filters);
  const remove = useDeleteTask();
  const complete = useMarkComplete();

  const onComplete = (t: Task) =>
    complete.mutate(t._id, {
      onSuccess: () => toast.success('Task completed'),
      onError: () => toast.error('Failed to complete task'),
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
          Add Task
        </Button>
      </div>

      <TaskFilters
        filters={rawFilters}
        onChange={setRawFilters}
        view={view}
        onViewChange={setView}
      />

      {tasks.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : tasks.isError ? (
        <ErrorState description="Couldn't load tasks." onRetry={() => tasks.refetch()} />
      ) : tasks.data && tasks.data.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Click + Add Task to get started."
          action={<Button onClick={() => setCreating(true)}>Add Task</Button>}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.data!.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onComplete={onComplete}
              onClick={setEditing}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.data!.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}

      <TaskFormModal open={creating} onClose={() => setCreating(false)} />
      <TaskFormModal open={!!editing} onClose={() => setEditing(null)} task={editing} />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          remove.mutate(confirmDelete._id, {
            onSuccess: () => toast.success('Task deleted'),
            onError: () => toast.error('Failed to delete'),
          });
        }}
        title="Delete this task?"
        description={confirmDelete?.title}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
```

- [ ] **Step 8: Typecheck + dev smoke**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors

# (with both server + client running)
# In browser: log in, /tasks shows tasks; create/edit/delete works.
```

- [ ] **Step 9: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): TasksPage with filters, search, grid/list views, modal CRUD"
```

---

## Task 20: PomodoroPage — timer ring, mode tabs, task selector, history, estimate prompt

**Files:**

- Create: `client/src/components/pomodoro/{ProgressRing.tsx,PomodoroModeTabs.tsx,FocusTaskSelector.tsx,PomodoroHistoryList.tsx,PomodoroTimer.tsx,EstimateReachedDialog.tsx}`
- Replace: `client/src/pages/PomodoroPage.tsx`
- Modify: `client/src/store/pomodoroStore.ts` (already designed in Task 16; this task only consumes it)

- [ ] **Step 1: Write `client/src/components/pomodoro/ProgressRing.tsx`**

```tsx
type Props = {
  size?: number;
  stroke?: number;
  progress: number;
  color?: string;
  children?: React.ReactNode;
};

export function ProgressRing({
  size = 240,
  stroke = 12,
  progress,
  color = 'rgb(99 102 241)',
  children,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgb(var(--border))"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Write `client/src/components/pomodoro/PomodoroModeTabs.tsx`**

```tsx
import type { PomodoroMode } from '@/types/pomodoro';
import { cn } from '@/utils/cn';

type Props = {
  mode: PomodoroMode;
  onChange: (m: PomodoroMode) => void;
  disabled?: boolean;
};

const tabs: { key: PomodoroMode; label: string }[] = [
  { key: 'Focus', label: 'Focus' },
  { key: 'ShortBreak', label: 'Short Break' },
  { key: 'LongBreak', label: 'Long Break' },
];

export function PomodoroModeTabs({ mode, onChange, disabled }: Props) {
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          disabled={disabled}
          onClick={() => onChange(t.key)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-sm transition',
            mode === t.key
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10'
              : 'text-text-muted hover:bg-bg',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `client/src/components/pomodoro/FocusTaskSelector.tsx`**

```tsx
import type { Task } from '@/types/task';

type Props = { tasks: Task[]; value: string | null; onChange: (id: string | null) => void };

export function FocusTaskSelector({ tasks, value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Focus on</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="block w-72 rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
      >
        <option value="">No task</option>
        {tasks.map((t) => (
          <option key={t._id} value={t._id}>
            {t.title} — {t.completedPomodoros}/{t.estimatedPomodoros}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 4: Write `client/src/components/pomodoro/PomodoroHistoryList.tsx`**

```tsx
import type { PomodoroSession } from '@/types/pomodoro';
import { fromNow } from '@/utils/dateUtils';

export function PomodoroHistoryList({ sessions }: { sessions: PomodoroSession[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-text-muted">No sessions yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li
          key={s._id}
          className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
        >
          <span>
            <span className="font-medium">{s.mode}</span> · {s.durationMinutes} min
          </span>
          <span className="text-xs text-text-muted">{fromNow(s.startedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Write `client/src/components/pomodoro/EstimateReachedDialog.tsx`**

```tsx
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

type Props = {
  open: boolean;
  taskTitle?: string;
  onKeepGoing: () => void;
  onMarkComplete: () => void;
};

export function EstimateReachedDialog({ open, taskTitle, onKeepGoing, onMarkComplete }: Props) {
  return (
    <Modal open={open} onClose={onKeepGoing} title="Estimate reached" size="sm">
      <p className="text-sm text-text-muted">
        You've reached the estimated pomodoros for {taskTitle ? `"${taskTitle}"` : 'this task'}.
        Mark as completed?
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onKeepGoing}>
          Keep going
        </Button>
        <Button onClick={onMarkComplete}>Mark complete</Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 6: Write `client/src/components/pomodoro/PomodoroTimer.tsx`**

```tsx
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { Button } from '@/components/common/Button';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { useRemainingMs } from '@/hooks/usePomodoroEngine';
import { unlockAudio } from '@/lib/audio';

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const colorByMode: Record<string, string> = {
  Focus: 'rgb(99 102 241)',
  ShortBreak: 'rgb(22 163 74)',
  LongBreak: 'rgb(37 99 235)',
};

export function PomodoroTimer({ taskTitle }: { taskTitle?: string | null }) {
  const status = usePomodoroStore((s) => s.status);
  const mode = usePomodoroStore((s) => s.mode);
  const durations = usePomodoroStore((s) => s.durations);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skip = usePomodoroStore((s) => s.skip);
  const remaining = useRemainingMs();

  const totalMs =
    (mode === 'Focus'
      ? durations.focus
      : mode === 'ShortBreak'
        ? durations.shortBreak
        : durations.longBreak) * 60_000;
  const progress = 1 - remaining / totalMs;

  const onStart = () => {
    unlockAudio();
    start();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <ProgressRing progress={progress} color={colorByMode[mode]}>
        <div className="text-center">
          <div className="text-5xl font-semibold tabular-nums">{fmt(remaining)}</div>
          <div className="mt-2 text-xs text-text-muted">
            {taskTitle ? `Focusing on: ${taskTitle}` : 'No task selected'}
          </div>
        </div>
      </ProgressRing>
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>
          Reset
        </Button>
        {status === 'running' ? (
          <Button size="lg" icon={<Pause className="h-5 w-5" />} onClick={pause}>
            Pause
          </Button>
        ) : (
          <Button size="lg" icon={<Play className="h-5 w-5" />} onClick={onStart}>
            Start
          </Button>
        )}
        <Button variant="secondary" icon={<SkipForward className="h-4 w-4" />} onClick={skip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write `client/src/pages/PomodoroPage.tsx`**

```tsx
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/common/Card';
import { PomodoroModeTabs } from '@/components/pomodoro/PomodoroModeTabs';
import { FocusTaskSelector } from '@/components/pomodoro/FocusTaskSelector';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { PomodoroHistoryList } from '@/components/pomodoro/PomodoroHistoryList';
import { EstimateReachedDialog } from '@/components/pomodoro/EstimateReachedDialog';
import { useRecentSessionsQuery } from '@/hooks/queries/usePomodoroQueries';
import { useTasksQuery, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { usePomodoroStore } from '@/store/pomodoroStore';

export default function PomodoroPage() {
  const tasks = useTasksQuery({ status: undefined, sortBy: 'deadline' });
  const sessions = useRecentSessionsQuery();
  const complete = useMarkComplete();

  const mode = usePomodoroStore((s) => s.mode);
  const status = usePomodoroStore((s) => s.status);
  const setMode = usePomodoroStore((s) => s.setMode);
  const reset = usePomodoroStore((s) => s.reset);
  const selectTask = usePomodoroStore((s) => s.selectTask);
  const selectedTaskId = usePomodoroStore((s) => s.selectedTaskId);
  const estimateTaskId = usePomodoroStore((s) => s.estimateReachedTaskId);
  const ack = usePomodoroStore((s) => s.acknowledgeEstimate);

  const focusables = useMemo(
    () => (tasks.data ?? []).filter((t) => t.status !== 'Completed'),
    [tasks.data],
  );
  const selectedTask = focusables.find((t) => t._id === selectedTaskId) || null;
  const estimateTask = (tasks.data ?? []).find((t) => t._id === estimateTaskId) || null;
  const showEstimate =
    !!estimateTaskId &&
    !!estimateTask &&
    estimateTask.status !== 'Completed' &&
    estimateTask.completedPomodoros >= estimateTask.estimatedPomodoros;

  const onModeChange = (m: typeof mode) => {
    if (status !== 'idle') {
      const ok = window.confirm('Switch will reset the timer. Continue?');
      if (!ok) return;
      reset();
    }
    setMode(m);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[2fr,1fr]">
      <Card>
        <div className="flex flex-col items-center gap-6">
          <PomodoroModeTabs mode={mode} onChange={onModeChange} />
          <PomodoroTimer taskTitle={selectedTask?.title} />
          <FocusTaskSelector tasks={focusables} value={selectedTaskId} onChange={selectTask} />
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Recent sessions</h2>
        <PomodoroHistoryList sessions={sessions.data ?? []} />
      </Card>

      <EstimateReachedDialog
        open={showEstimate}
        taskTitle={estimateTask?.title}
        onKeepGoing={ack}
        onMarkComplete={() => {
          if (!estimateTask) return ack();
          complete.mutate(estimateTask._id, {
            onSuccess: () => {
              toast.success('Task completed');
              ack();
            },
            onError: () => {
              toast.error('Failed to complete');
              ack();
            },
          });
        }}
      />
    </div>
  );
}
```

- [ ] **Step 8: Typecheck**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 9: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): PomodoroPage — ring timer, mode tabs, task selector, history, estimate prompt"
```

---

## Task 21: DashboardPage — summary cards + lists + mini chart

**Files:**

- Create: `client/src/components/dashboard/{SummaryCard.tsx,TodayTasks.tsx,UpcomingTasks.tsx,RecentPomodoros.tsx,CompletionMiniChart.tsx}`
- Replace: `client/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Write `client/src/components/dashboard/SummaryCard.tsx`**

```tsx
import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/common/Card';

type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'default' | 'warn' | 'good';
};

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-primary-600',
  warn: 'text-priority-high',
  good: 'text-priority-low',
};

export function SummaryCard({ icon: Icon, label, value, tone = 'default' }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
        <Icon className={`h-6 w-6 ${toneClasses[tone]}`} />
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Write `client/src/components/dashboard/TodayTasks.tsx`**

```tsx
import type { Task } from '@/types/task';
import { TaskRow } from '@/components/tasks/TaskRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { toast } from 'sonner';

export function TodayTasks({ tasks, onEdit }: { tasks: Task[]; onEdit: (t: Task) => void }) {
  const remove = useDeleteTask();
  const complete = useMarkComplete();
  if (!tasks.length) return <EmptyState title="No tasks for today" />;
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <TaskRow
          key={t._id}
          task={t}
          onEdit={onEdit}
          onComplete={(t) => complete.mutate(t._id, { onError: () => toast.error('Failed') })}
          onDelete={(t) => remove.mutate(t._id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `client/src/components/dashboard/UpcomingTasks.tsx`**

```tsx
import type { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { PriorityBadge } from '@/components/common/Badge';
import { formatDateTime } from '@/utils/dateUtils';

export function UpcomingTasks({ tasks, onClick }: { tasks: Task[]; onClick: (t: Task) => void }) {
  if (!tasks.length) {
    return (
      <Card>
        <p className="text-sm text-text-muted">Nothing upcoming.</p>
      </Card>
    );
  }
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Upcoming deadlines</h3>
      <ul className="divide-y divide-border">
        {tasks.map((t) => (
          <li key={t._id}>
            <button
              onClick={() => onClick(t)}
              className="flex w-full items-center justify-between py-2 text-left"
            >
              <div>
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-text-muted">{formatDateTime(t.deadline)}</div>
              </div>
              <PriorityBadge priority={t.priority} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 4: Write `client/src/components/dashboard/RecentPomodoros.tsx`**

```tsx
import type { PomodoroSession } from '@/types/pomodoro';
import { Card } from '@/components/common/Card';
import { fromNow } from '@/utils/dateUtils';

export function RecentPomodoros({ sessions }: { sessions: PomodoroSession[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Recent pomodoros</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-text-muted">No sessions yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s._id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="font-medium">{s.mode}</span> · {s.durationMinutes} min
              </span>
              <span className="text-xs text-text-muted">{fromNow(s.startedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
```

- [ ] **Step 5: Write `client/src/components/dashboard/CompletionMiniChart.tsx`**

```tsx
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/common/Card';
import { format, parseISO } from 'date-fns';

type Point = { date: string; count: number };

export function CompletionMiniChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'EEE') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Last 7 days completion</h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis hide allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="rgb(99 102 241)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 6: Write `client/src/pages/DashboardPage.tsx`**

```tsx
import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, ListTodo, Timer, Flame } from 'lucide-react';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/common/Card';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { UpcomingTasks } from '@/components/dashboard/UpcomingTasks';
import { RecentPomodoros } from '@/components/dashboard/RecentPomodoros';
import { CompletionMiniChart } from '@/components/dashboard/CompletionMiniChart';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
import { useAuth } from '@/hooks/useAuth';
import { minutesToHM } from '@/utils/dateUtils';
import type { Task } from '@/types/task';

export default function DashboardPage() {
  const { user } = useAuth();
  const dash = useDashboardQuery();
  const [editing, setEditing] = useState<Task | null>(null);

  if (dash.isLoading) return <Loading />;
  if (dash.isError || !dash.data) return <ErrorState onRetry={() => dash.refetch()} />;
  const d = dash.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-text-muted">{new Date().toDateString()}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={ListTodo} label="Total tasks" value={d.totalTasks} />
        <SummaryCard icon={CheckCircle} label="Completed" value={d.completedTasks} tone="good" />
        <SummaryCard icon={Clock} label="In progress" value={d.inProgressTasks} />
        <SummaryCard icon={AlertTriangle} label="Overdue" value={d.overdueTasks} tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCard icon={Timer} label="Pomodoros today" value={d.todayPomodoros} />
        <SummaryCard
          icon={Flame}
          label="Focus time today"
          value={minutesToHM(d.todayFocusMinutes)}
          tone="good"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Today</h3>
          <TodayTasks tasks={d.todayTasks} onEdit={setEditing} />
        </Card>
        <UpcomingTasks tasks={d.upcomingTasks} onClick={setEditing} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentPomodoros sessions={d.recentSessions} />
        <CompletionMiniChart data={d.completionChart} />
      </div>

      <TaskFormModal open={!!editing} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
```

- [ ] **Step 7: Typecheck**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 8: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): DashboardPage with summary cards, lists, mini chart"
```

---

## Task 22: CalendarPage — react-big-calendar + DayTasksPanel

**Files:**

- Create: `client/src/components/calendar/{CalendarView.tsx,DayTasksPanel.tsx}`
- Replace: `client/src/pages/CalendarPage.tsx`
- Modify: `client/src/index.css` (import react-big-calendar styles + dark overrides)

- [ ] **Step 1: Append to `client/src/index.css`**

```css
@import 'react-big-calendar/lib/css/react-big-calendar.css';

.rbc-calendar {
  background: rgb(var(--surface));
  color: rgb(var(--text));
  border-radius: 16px;
  padding: 8px;
}
.rbc-toolbar button {
  color: rgb(var(--text));
}
.rbc-month-view,
.rbc-time-view,
.rbc-time-header,
.rbc-header,
.rbc-day-bg,
.rbc-month-row {
  border-color: rgb(var(--border)) !important;
}
.rbc-off-range-bg {
  background: rgba(0, 0, 0, 0.04);
}
.dark .rbc-off-range-bg {
  background: rgba(255, 255, 255, 0.04);
}
.rbc-today {
  background: rgba(99, 102, 241, 0.08);
}
.rbc-event {
  border: none;
  padding: 2px 6px;
}
```

- [ ] **Step 2: Write `client/src/components/calendar/CalendarView.tsx`**

```tsx
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import type { Task } from '@/types/task';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type Event = { id: string; title: string; start: Date; end: Date; resource: Task };

const colorByPriority = (p: Task['priority']) =>
  p === 'High' ? 'rgb(220 38 38)' : p === 'Medium' ? 'rgb(245 158 11)' : 'rgb(22 163 74)';

type Props = {
  tasks: Task[];
  selectedDate: Date | null;
  view: View;
  onViewChange: (v: View) => void;
  onSelectDay: (d: Date) => void;
  onSelectTask: (t: Task) => void;
};

export function CalendarView({
  tasks,
  selectedDate,
  view,
  onViewChange,
  onSelectDay,
  onSelectTask,
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
      style={{ height: 600 }}
      selectable
      onSelectSlot={(s) => onSelectDay(s.start)}
      onSelectEvent={(e) => onSelectTask((e as Event).resource)}
      dayPropGetter={(date) =>
        selectedDate && isSameDay(date, selectedDate)
          ? { style: { background: 'rgba(99,102,241,0.12)' } }
          : {}
      }
      eventPropGetter={(e) => ({
        style: { backgroundColor: colorByPriority((e as Event).resource.priority), color: 'white' },
      })}
    />
  );
}
```

- [ ] **Step 3: Write `client/src/components/calendar/DayTasksPanel.tsx`**

```tsx
import { format, isSameDay, parseISO } from 'date-fns';
import type { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { TaskRow } from '@/components/tasks/TaskRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { toast } from 'sonner';

type Props = { date: Date | null; tasks: Task[]; onEdit: (t: Task) => void };

export function DayTasksPanel({ date, tasks, onEdit }: Props) {
  const remove = useDeleteTask();
  const complete = useMarkComplete();
  if (!date) {
    return (
      <Card>
        <p className="text-sm text-text-muted">Select a day to view tasks.</p>
      </Card>
    );
  }
  const items = tasks.filter((t) => isSameDay(parseISO(t.deadline), date));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks on {format(date, 'MMM d, yyyy')}</h3>
      {items.length === 0 ? (
        <EmptyState title="No tasks on this day" />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              onEdit={onEdit}
              onComplete={(t) => complete.mutate(t._id, { onError: () => toast.error('Failed') })}
              onDelete={(t) => remove.mutate(t._id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 4: Write `client/src/pages/CalendarPage.tsx`**

```tsx
import { useState } from 'react';
import type { View } from 'react-big-calendar';
import { Card } from '@/components/common/Card';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayTasksPanel } from '@/components/calendar/DayTasksPanel';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { useTasksQuery } from '@/hooks/queries/useTaskQueries';
import type { Task } from '@/types/task';

export default function CalendarPage() {
  const tasks = useTasksQuery({ sortBy: 'deadline' });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<View>('month');
  const [editing, setEditing] = useState<Task | null>(null);

  if (tasks.isLoading) return <Loading />;
  if (tasks.isError) return <ErrorState onRetry={() => tasks.refetch()} />;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
      <Card padded={false}>
        <div className="p-2">
          <CalendarView
            tasks={tasks.data ?? []}
            selectedDate={selectedDate}
            view={view}
            onViewChange={setView}
            onSelectDay={setSelectedDate}
            onSelectTask={setEditing}
          />
        </div>
      </Card>
      <DayTasksPanel date={selectedDate} tasks={tasks.data ?? []} onEdit={setEditing} />
      <TaskFormModal open={!!editing} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + smoke**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): CalendarPage with react-big-calendar and day tasks panel"
```

---

## Task 23: StatisticsPage — RangeSelector + 5 Recharts charts

**Files:**

- Create: `client/src/components/statistics/{RangeSelector.tsx,TaskCompletionChart.tsx,PomodoroChart.tsx,FocusMinutesChart.tsx,PriorityPie.tsx,StatusPie.tsx}`
- Replace: `client/src/pages/StatisticsPage.tsx`

- [ ] **Step 1: Write `client/src/components/statistics/RangeSelector.tsx`**

```tsx
import type { StatRange } from '@/types/statistics';
import { cn } from '@/utils/cn';

const opts: { v: StatRange; label: string }[] = [
  { v: '7days', label: '7 days' },
  { v: '30days', label: '30 days' },
  { v: 'month', label: 'This month' },
];

export function RangeSelector({
  value,
  onChange,
}: {
  value: StatRange;
  onChange: (v: StatRange) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-sm transition',
            value === o.v
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10'
              : 'text-text-muted hover:bg-bg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `client/src/components/statistics/TaskCompletionChart.tsx`**

```tsx
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { TaskStatsResponse } from '@/types/statistics';
import { Card } from '@/components/common/Card';

export function TaskCompletionChart({ data }: { data: TaskStatsResponse }) {
  const fmt = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'MMM d') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks completed</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={fmt}>
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="rgb(99 102 241)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Write `client/src/components/statistics/PomodoroChart.tsx`**

```tsx
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyPomodoroPoint } from '@/types/statistics';
import { Card } from '@/components/common/Card';

export function PomodoroChart({ data }: { data: DailyPomodoroPoint[] }) {
  const fmt = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'MMM d') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Pomodoros completed</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={fmt}>
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="sessions" fill="rgb(22 163 74)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Write `client/src/components/statistics/FocusMinutesChart.tsx`**

```tsx
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyPomodoroPoint } from '@/types/statistics';
import { Card } from '@/components/common/Card';

export function FocusMinutesChart({ data }: { data: DailyPomodoroPoint[] }) {
  const fmt = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'MMM d') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Focus minutes</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={fmt}>
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="focusMinutes"
              stroke="rgb(99 102 241)"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Write `client/src/components/statistics/PriorityPie.tsx`**

```tsx
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PriorityCount } from '@/types/statistics';
import { Card } from '@/components/common/Card';

const COLOR: Record<string, string> = { Low: '#16a34a', Medium: '#f59e0b', High: '#dc2626' };

export function PriorityPie({ data }: { data: PriorityCount[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks by priority</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="priority" outerRadius={80} label>
              {data.map((d) => (
                <Cell key={d.priority} fill={COLOR[d.priority]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 6: Write `client/src/components/statistics/StatusPie.tsx`**

```tsx
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatusCount } from '@/types/statistics';
import { Card } from '@/components/common/Card';

const COLOR: Record<string, string> = {
  Todo: '#64748b',
  InProgress: '#2563eb',
  Completed: '#16a34a',
};

export function StatusPie({ data }: { data: StatusCount[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks by status</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" outerRadius={80} label>
              {data.map((d) => (
                <Cell key={d.status} fill={COLOR[d.status]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 7: Write `client/src/pages/StatisticsPage.tsx`**

```tsx
import { useState } from 'react';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { RangeSelector } from '@/components/statistics/RangeSelector';
import { TaskCompletionChart } from '@/components/statistics/TaskCompletionChart';
import { PomodoroChart } from '@/components/statistics/PomodoroChart';
import { FocusMinutesChart } from '@/components/statistics/FocusMinutesChart';
import { PriorityPie } from '@/components/statistics/PriorityPie';
import { StatusPie } from '@/components/statistics/StatusPie';
import { usePomodoroStatsQuery, useTaskStatsQuery } from '@/hooks/queries/useStatisticsQueries';
import type { StatRange } from '@/types/statistics';

export default function StatisticsPage() {
  const [range, setRange] = useState<StatRange>('7days');
  const taskStats = useTaskStatsQuery(range);
  const pomoStats = usePomodoroStatsQuery(range);

  if (taskStats.isLoading || pomoStats.isLoading) return <Loading />;
  if (taskStats.isError || pomoStats.isError) {
    return (
      <ErrorState
        onRetry={() => {
          taskStats.refetch();
          pomoStats.refetch();
        }}
      />
    );
  }

  const noData =
    (taskStats.data ?? []).every((d) => d.count === 0) &&
    (pomoStats.data?.daily ?? []).every((d) => d.sessions === 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {noData ? (
        <EmptyState
          title="Not enough data yet"
          description="Complete some tasks or focus sessions to see stats."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TaskCompletionChart data={taskStats.data!} />
            <PomodoroChart data={pomoStats.data!.daily} />
          </div>
          <FocusMinutesChart data={pomoStats.data!.daily} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PriorityPie data={pomoStats.data!.byPriority} />
            <StatusPie data={pomoStats.data!.byStatus} />
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Typecheck**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 9: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): StatisticsPage with 5 Recharts visualizations + range selector"
```

---

## Task 24: SettingsPage — 4 sub-forms (profile, password, durations, preferences)

**Files:**

- Create: `client/src/validators/settings.schema.ts`
- Replace: `client/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Write `client/src/validators/settings.schema.ts`**

```ts
import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Required').max(100),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type PasswordValues = z.infer<typeof passwordSchema>;

export const durationsSchema = z.object({
  focusDuration: z.coerce.number().int().min(1).max(120),
  shortBreakDuration: z.coerce.number().int().min(1).max(60),
  longBreakDuration: z.coerce.number().int().min(1).max(60),
});
export type DurationValues = z.infer<typeof durationsSchema>;

export const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  notificationEnabled: z.boolean(),
});
export type PreferencesValues = z.infer<typeof preferencesSchema>;
```

- [ ] **Step 2: Write `client/src/pages/SettingsPage.tsx`**

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { useAuth } from '@/hooks/useAuth';
import {
  useChangePassword,
  useSettingsQuery,
  useUpdateProfile,
  useUpdateSettings,
} from '@/hooks/queries/useSettingsQueries';
import { useThemeStore } from '@/store/themeStore';
import { usePomodoroStore } from '@/store/pomodoroStore';
import {
  profileSchema,
  passwordSchema,
  durationsSchema,
  preferencesSchema,
  type ProfileValues,
  type PasswordValues,
  type DurationValues,
  type PreferencesValues,
} from '@/validators/settings.schema';

export default function SettingsPage() {
  const { user } = useAuth();
  const settings = useSettingsQuery();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateSettings = useUpdateSettings();
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = usePomodoroStore((s) => s.hydrateFromSettings);

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '' },
  });
  const password = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const durations = useForm<DurationValues>({
    resolver: zodResolver(durationsSchema),
    defaultValues: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 },
  });
  const preferences = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { theme: 'light', notificationEnabled: true },
  });

  useEffect(() => {
    if (user) profile.reset({ fullName: user.fullName });
    if (settings.data) {
      durations.reset({
        focusDuration: settings.data.focusDuration,
        shortBreakDuration: settings.data.shortBreakDuration,
        longBreakDuration: settings.data.longBreakDuration,
      });
      preferences.reset({
        theme: settings.data.theme,
        notificationEnabled: settings.data.notificationEnabled,
      });
    }
  }, [user, settings.data, profile, durations, preferences]);

  if (settings.isLoading) return <Loading />;

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Profile</h3>
        <form
          onSubmit={profile.handleSubmit((v) =>
            updateProfile.mutate(v, {
              onSuccess: () => toast.success('Profile updated'),
              onError: () => toast.error('Failed'),
            }),
          )}
          className="space-y-3"
        >
          <Input
            label="Full name"
            {...profile.register('fullName')}
            error={profile.formState.errors.fullName?.message}
          />
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={updateProfile.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Change password</h3>
        <form
          onSubmit={password.handleSubmit((v) =>
            changePassword.mutate(v, {
              onSuccess: () => {
                toast.success('Password updated');
                password.reset();
              },
              onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Failed'),
            }),
          )}
          className="space-y-3"
        >
          <Input
            label="Current password"
            type="password"
            {...password.register('currentPassword')}
            error={password.formState.errors.currentPassword?.message}
          />
          <Input
            label="New password"
            type="password"
            {...password.register('newPassword')}
            error={password.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm new password"
            type="password"
            {...password.register('confirmPassword')}
            error={password.formState.errors.confirmPassword?.message}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={changePassword.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Pomodoro durations (minutes)</h3>
        <form
          onSubmit={durations.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => {
                toast.success('Durations updated');
                hydrate(v);
              },
              onError: () => toast.error('Failed'),
            }),
          )}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <Input
            label="Focus"
            type="number"
            min={1}
            max={120}
            {...durations.register('focusDuration')}
            error={durations.formState.errors.focusDuration?.message}
          />
          <Input
            label="Short break"
            type="number"
            min={1}
            max={60}
            {...durations.register('shortBreakDuration')}
            error={durations.formState.errors.shortBreakDuration?.message}
          />
          <Input
            label="Long break"
            type="number"
            min={1}
            max={60}
            {...durations.register('longBreakDuration')}
            error={durations.formState.errors.longBreakDuration?.message}
          />
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" loading={updateSettings.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Preferences</h3>
        <form
          onSubmit={preferences.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => {
                toast.success('Preferences saved');
                setTheme(v.theme);
              },
              onError: () => toast.error('Failed'),
            }),
          )}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">Theme</label>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="light" {...preferences.register('theme')} /> Light
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="dark" {...preferences.register('theme')} /> Dark
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...preferences.register('notificationEnabled')} /> Enable
            notifications
          </label>
          <div className="flex justify-end">
            <Button type="submit" loading={updateSettings.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): SettingsPage with profile/password/durations/preferences forms"
```

---

## Task 25: Notification bell + polling + click-through to task

**Files:**

- Create: `client/src/components/notifications/{NotificationPanel.tsx,NotificationItem.tsx,NotificationBell.tsx}`
- Modify: `client/src/components/layout/Header.tsx` (mount NotificationBell)

- [ ] **Step 1: Write `client/src/components/notifications/NotificationItem.tsx`**

```tsx
import type { Notification } from '@/types/notification';
import { fromNow } from '@/utils/dateUtils';
import { cn } from '@/utils/cn';

const labelByType: Record<Notification['type'], string> = {
  task_overdue: 'Overdue',
  task_completed: 'Completed',
  pomodoro_done: 'Pomodoro',
  deadline_soon: 'Deadline',
  estimated_reached: 'Estimate',
};

type Props = { n: Notification; onClick: (n: Notification) => void };

export function NotificationItem({ n, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(n)}
      className={cn(
        'flex w-full items-start gap-2 rounded-2xl px-3 py-2 text-left transition hover:bg-bg',
        !n.isRead && 'bg-primary-50/40 dark:bg-primary-500/10',
      )}
    >
      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium">{n.title}</span>
          <span className="ml-2 text-[10px] uppercase text-text-muted">{labelByType[n.type]}</span>
        </div>
        <p className="line-clamp-2 text-xs text-text-muted">{n.message}</p>
        <p className="mt-1 text-[11px] text-text-muted">{fromNow(n.createdAt)}</p>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Write `client/src/components/notifications/NotificationPanel.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import {
  useMarkAllNotifRead,
  useMarkNotifRead,
  useNotificationsQuery,
} from '@/hooks/queries/useNotificationQueries';
import { NotificationItem } from './NotificationItem';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const list = useNotificationsQuery();
  const markRead = useMarkNotifRead();
  const markAllRead = useMarkAllNotifRead();
  const navigate = useNavigate();

  const onClick = (n: any) => {
    if (!n.isRead) markRead.mutate(n._id);
    if (n.taskId) {
      navigate(`/tasks?focus=${n.taskId}`);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-12 z-40 w-80 rounded-3xl border border-border bg-surface p-2 shadow-md">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-sm font-semibold">Notifications</span>
        <button
          className="text-xs text-text-muted hover:text-text"
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-96 overflow-auto">
        {list.isLoading ? (
          <Loading />
        ) : list.data && list.data.length > 0 ? (
          <ul className="space-y-1 p-1">
            {list.data.map((n) => (
              <li key={n._id}>
                <NotificationItem n={n} onClick={onClick} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="You're all caught up" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `client/src/components/notifications/NotificationBell.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationsQuery } from '@/hooks/queries/useNotificationQueries';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useNotificationsQuery();
  const unread = (data ?? []).filter((n) => !n.isRead).length;
  const display = unread > 9 ? '9+' : String(unread);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-2xl p-2 text-text-muted hover:bg-bg"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-priority-high px-1 text-[10px] font-bold text-white">
            {display}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 4: Mount in `Header.tsx`** — replace the comment `/* Notification bell mounted in Task 25 */` with:

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';
// ... and in JSX, replace the comment with:
<NotificationBell />;
```

- [ ] **Step 5: Typecheck**

```bash
cd client && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add client
git commit -m "feat(client): notification bell with polling + panel + mark-read interactions"
```

---

## Task 26: Final README + manual verification + smoke test

**Files:**

- Modify: `README.md`
- Verify: backend + frontend run end-to-end

- [ ] **Step 1: Replace root `README.md`**

```markdown
# Task88 Clone

Productivity web app: tasks, pomodoro timer, calendar, dashboard, statistics, settings, in-app notifications. Inspired by https://www.Task88.pro.vn/.

> Study Together is intentionally NOT implemented.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + React Query + Zustand + Recharts + react-big-calendar + sonner + lucide-react
- **Backend:** Node.js 20 + Express + MongoDB (Mongoose) + JWT + bcrypt
- **Tests:** Jest + Supertest + mongodb-memory-server (server), Vitest + Testing Library (client)

## Project layout
```

server/ Express + Mongo API
client/ React SPA
docs/ Design specs and implementation plans

````

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
````

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Visit http://localhost:5173 and log in:

- Email: `demo@Task88.com`
- Password: `123456`

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

`demo@Task88.com` / `123456` (after `npm run seed:reset` in server).

## Security notes

- JWT tokens are stored in `localStorage` per spec. This is vulnerable to XSS; for production deployments add a strict CSP, sanitize all user-provided HTML, and consider migrating to httpOnly cookies + CSRF.
- Passwords are hashed with bcrypt (cost 10).
- Every Mongoose query for user-owned resources filters by `userId`; tests verify cross-user 404 behavior.

## Not implemented (intentional)

- Study Together (and any realtime collaboration)
- Forgot password / email reset
- E2E browser tests
- Docker / deployment configs
- i18n (UI is English only)

## Tests

```bash
cd server && npm test       # backend ~25 cases
cd client && npm test       # frontend critical tests
```

## License

MIT (or replace with your preferred license).

````

- [ ] **Step 2: Run full backend suite**

```bash
cd server && npm test
# Expected: all suites green
````

- [ ] **Step 3: Run frontend tests + typecheck + build**

```bash
cd ../client && npm test -- --run && npx tsc --noEmit && npm run build
# Expected: tests pass, 0 type errors, build succeeds
```

- [ ] **Step 4: Manual verification (run both servers, browse)**

Open two terminals:

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Then verify in browser at http://localhost:5173:

- [ ] Register a new user; redirected to `/dashboard`
- [ ] Logout, login as `demo@Task88.com` / `123456`
- [ ] **Tasks page**: create, edit, delete, mark complete, search, filter by status/priority/deadline, switch grid/list views
- [ ] **Pomodoro page**: start a 25-min focus, pause, resume, skip; verify timer keeps counting after route change; complete a focus session and confirm `pomodoros recent` updates and task `completedPomodoros` increments
- [ ] **Calendar page**: month view shows tasks at their deadline date; click a day → DayTasksPanel populates; click an event → modal opens
- [ ] **Statistics page**: switch ranges; charts render real data
- [ ] **Dashboard**: summary cards reflect real counts; today's tasks and upcoming lists populated
- [ ] **Settings**: change full name, change durations (verify pomodoro page reflects new durations on next idle), toggle dark theme (page styling flips), toggle notifications
- [ ] **Notifications**: bell shows badge; click opens panel; mark-as-read works; click an item with `taskId` navigates to `/tasks`
- [ ] Logout → redirect to `/login`; visiting `/dashboard` while logged out redirects back
- [ ] Resize browser to ~375px (mobile): sidebar becomes drawer, layout stays usable

- [ ] **Step 5: Commit**

```bash
cd ..
git add README.md
git commit -m "docs: finalize README with run instructions, API list, scripts, security notes"
```

---

## Self-Review Note

After implementation, run the following sanity checks:

1. `cd server && npm test` — all green
2. `cd client && npm test -- --run && npx tsc --noEmit && npm run build` — all green, build succeeds
3. Browse the manual verification list in Task 26 Step 4 — every checkbox confirmed
4. `git log --oneline` — commits map cleanly to tasks
5. Confirm Study Together appears nowhere (`grep -ri "study together" .` should match only this README disclaimer)

If any acceptance criterion in `docs/superpowers/specs/2026-05-27-Task88-clone-design.md` §15 fails, open a follow-up task before declaring done.
