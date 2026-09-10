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

test('Home renders the interactive Split authentication flow', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-testid="auth-form"/);
  assert.match(html, /继续训练。/);
});

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

async function createPlan(cookie, name) {
  const response = await request('/api/plans', {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({ name }),
  });
  if (response.status !== 201) assert.fail(`create plan failed: ${await response.text()}`);
  return (await response.json()).plan;
}

test('User composes a Workout Plan from owned Exercises and Workout Days', async () => {
  const aliceCookie = await signUp('PlanAuthor');
  const bobCookie = await signUp('OtherUser');
  const plan = await createPlan(aliceCookie, 'Push Pull Legs');

  const createdExercise = await request('/api/exercises', {
    method: 'POST',
    headers: { cookie: aliceCookie },
    body: JSON.stringify({
      name: 'Bench Press',
      resistanceType: 'WEIGHTED',
      targetType: 'REPETITIONS',
    }),
  });
  assert.equal(createdExercise.status, 201);
  const exercise = (await createdExercise.json()).exercise;

  const renamed = await request(`/api/exercises/${exercise.id}`, {
    method: 'PATCH',
    headers: { cookie: aliceCookie },
    body: JSON.stringify({ name: 'Barbell Bench Press' }),
  });
  assert.equal(renamed.status, 200);
  assert.equal((await renamed.json()).exercise.id, exercise.id);

  const aliceExercises = await request('/api/exercises', { headers: { cookie: aliceCookie } });
  assert.deepEqual((await aliceExercises.json()).exercises, [{
    id: exercise.id,
    name: 'Barbell Bench Press',
    resistanceType: 'WEIGHTED',
    targetType: 'REPETITIONS',
  }]);
  const bobExercises = await request('/api/exercises', { headers: { cookie: bobCookie } });
  assert.deepEqual(await bobExercises.json(), { exercises: [] });

  const dayResponse = await request(`/api/plans/${plan.id}/days`, {
    method: 'POST',
    headers: { cookie: aliceCookie },
    body: JSON.stringify({ name: 'Push Day', suggestedWeekday: 1 }),
  });
  assert.equal(dayResponse.status, 201);
  const day = (await dayResponse.json()).workoutDay;

  const forbiddenDay = await request(`/api/plans/${plan.id}/days`, {
    method: 'POST',
    headers: { cookie: bobCookie },
    body: JSON.stringify({ name: 'Stolen Day' }),
  });
  assert.equal(forbiddenDay.status, 404);

  const invalidTarget = await request(`/api/plans/${plan.id}/days/${day.id}/exercises`, {
    method: 'POST',
    headers: { cookie: aliceCookie },
    body: JSON.stringify({ exerciseId: exercise.id, setCount: 3, targetValue: 8 }),
  });
  assert.equal(invalidTarget.status, 400);

  const plannedResponse = await request(`/api/plans/${plan.id}/days/${day.id}/exercises`, {
    method: 'POST',
    headers: { cookie: aliceCookie },
    body: JSON.stringify({
      exerciseId: exercise.id,
      setCount: 3,
      targetValue: 8,
      weight: 60,
      weightUnit: 'kg',
    }),
  });
  assert.equal(plannedResponse.status, 201);
  const plannedExercise = (await plannedResponse.json()).plannedExercise;
  assert.equal(typeof plannedExercise.id, 'string');
  assert.deepEqual({ ...plannedExercise, id: undefined }, {
    id: undefined,
    exerciseId: exercise.id,
    setCount: 3,
    targetValue: 8,
    weightGrams: 60_000,
  });
});
