import assert from 'node:assert/strict';
import { test } from 'node:test';

const baseUrl = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3100';

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      origin: baseUrl,
      ...options.headers,
    },
  });
}

async function signUp(label) {
  const email = `${label}-${crypto.randomUUID()}@example.com`;
  const response = await request('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ name: label, email, password: 'test-password-123' }),
  });

  if (response.status !== 200) assert.fail(`sign-up failed: ${await response.text()}`);
  const cookie = response.headers.getSetCookie().map((value) => value.split(';', 1)[0]).join('; ');
  assert.ok(cookie, 'sign-up must establish a session cookie');
  return cookie;
}

test('Workout Plans are isolated by the authenticated User', async () => {
  const anonymous = await request('/api/plans');
  assert.equal(anonymous.status, 401);

  const aliceCookie = await signUp('Alice');
  const bobCookie = await signUp('Bob');

  const created = await request('/api/plans', {
    method: 'POST',
    headers: { cookie: aliceCookie },
    body: JSON.stringify({ name: 'Strength Base' }),
  });
  if (created.status !== 201) assert.fail(`create failed: ${await created.text()}`);
  const createdBody = await created.json();
  assert.equal(typeof createdBody.plan.id, 'string');
  assert.equal(createdBody.plan.name, 'Strength Base');

  const alicePlans = await request('/api/plans', { headers: { cookie: aliceCookie } });
  assert.equal(alicePlans.status, 200);
  assert.equal((await alicePlans.json()).plans.length, 1);

  const bobPlans = await request('/api/plans', { headers: { cookie: bobCookie } });
  assert.equal(bobPlans.status, 200);
  assert.deepEqual(await bobPlans.json(), { plans: [] });
});
