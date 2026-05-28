import request from 'supertest';

export async function createAuthedAgent(app, overrides = {}) {
  const body = {
    fullName: overrides.fullName ?? 'Test User',
    email:    overrides.email    ?? `u${Date.now()}${Math.random().toString(16).slice(2,6)}@x.com`,
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
    get:    wrap('get'),
    post:   wrap('post'),
    put:    wrap('put'),
    patch:  wrap('patch'),
    delete: wrap('delete'),
  };
}
