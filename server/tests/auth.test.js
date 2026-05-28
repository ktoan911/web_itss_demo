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
