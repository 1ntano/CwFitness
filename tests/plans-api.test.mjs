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

async function createExercise(cookie, data) {
  const response = await request('/api/exercises', {
    method: 'POST', headers: { cookie }, body: JSON.stringify(data),
  });
  assert.equal(response.status, 201);
  return (await response.json()).exercise;
}

async function createWorkoutDay(cookie, planId, name) {
  const response = await request(`/api/plans/${planId}/days`, {
    method: 'POST', headers: { cookie }, body: JSON.stringify({ name }),
  });
  assert.equal(response.status, 201);
  return (await response.json()).workoutDay;
}

async function addPlannedExercise(cookie, planId, dayId, data) {
  const response = await request(`/api/plans/${planId}/days/${dayId}/exercises`, {
    method: 'POST', headers: { cookie }, body: JSON.stringify(data),
  });
  assert.equal(response.status, 201);
  return (await response.json()).plannedExercise;
}

test('User starts one snapshotted Workout Session and completes its timed lifecycle', async () => {
  const cookie = await signUp('SessionOwner');
  const otherCookie = await signUp('SessionOther');
  const plan = await createPlan(cookie, 'Session Plan');
  const day = await createWorkoutDay(cookie, plan.id, 'Strength Day');
  const exercise = await createExercise(cookie, {
    name: 'Back Squat', resistanceType: 'WEIGHTED', targetType: 'REPETITIONS',
  });
  await addPlannedExercise(cookie, plan.id, day.id, {
    exerciseId: exercise.id, setCount: 4, targetValue: 6, weight: 100, weightUnit: 'kg',
  });

  const started = await request('/api/workout-sessions', {
    method: 'POST', headers: { cookie },
    body: JSON.stringify({ workoutDayId: day.id, timeZone: 'Asia/Shanghai' }),
  });
  assert.equal(started.status, 201);
  const session = (await started.json()).workoutSession;
  assert.equal(session.status, 'ACTIVE');
  assert.equal(session.timeZone, 'Asia/Shanghai');
  assert.match(session.localStartDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof session.exercises[0].id, 'string');
  assert.deepEqual(session.exercises.map((item) => ({
    exerciseId: item.exerciseId,
    exerciseName: item.exerciseName,
    resistanceType: item.resistanceType,
    targetType: item.targetType,
    setCount: item.setCount,
    targetValue: item.targetValue,
    weightGrams: item.weightGrams,
  })), [{
    exerciseId: exercise.id,
    exerciseName: 'Back Squat',
    resistanceType: 'WEIGHTED',
    targetType: 'REPETITIONS',
    setCount: 4,
    targetValue: 6,
    weightGrams: 100_000,
  }]);

  const duplicate = await request('/api/workout-sessions', {
    method: 'POST', headers: { cookie },
    body: JSON.stringify({ workoutDayId: day.id, timeZone: 'Asia/Shanghai' }),
  });
  assert.equal(duplicate.status, 409);

  const hidden = await request(`/api/workout-sessions/${session.id}/pause`, {
    method: 'POST', headers: { cookie: otherCookie }, body: '{}',
  });
  assert.equal(hidden.status, 404);

  const paused = await request(`/api/workout-sessions/${session.id}/pause`, {
    method: 'POST', headers: { cookie }, body: '{}',
  });
  assert.equal(paused.status, 200);
  assert.equal((await paused.json()).workoutSession.status, 'PAUSED');

  const active = await request('/api/workout-sessions/active', { headers: { cookie } });
  assert.equal(active.status, 200);
  assert.equal((await active.json()).workoutSession.id, session.id);

  const resumed = await request(`/api/workout-sessions/${session.id}/resume`, {
    method: 'POST', headers: { cookie }, body: '{}',
  });
  assert.equal(resumed.status, 200);
  assert.equal((await resumed.json()).workoutSession.status, 'ACTIVE');

  const completed = await request(`/api/workout-sessions/${session.id}/complete`, {
    method: 'POST', headers: { cookie }, body: '{}',
  });
  assert.equal(completed.status, 200);
  const completedSession = (await completed.json()).workoutSession;
  assert.equal(completedSession.status, 'COMPLETED');
  assert.equal(Number.isInteger(completedSession.trainingTimeSeconds), true);
  assert.equal(completedSession.trainingTimeSeconds >= 0, true);
  assert.equal((await (await request('/api/workout-sessions/active', { headers: { cookie } })).json()).workoutSession, null);
});

test('User records sets and receives per-Exercise achievement without removed Exercises', async () => {
  const cookie = await signUp('SetRecorder');
  const plan = await createPlan(cookie, 'Scoring Plan');
  const day = await createWorkoutDay(cookie, plan.id, 'Full Body');
  const weighted = await createExercise(cookie, {
    name: 'Deadlift', resistanceType: 'WEIGHTED', targetType: 'REPETITIONS',
  });
  await addPlannedExercise(cookie, plan.id, day.id, {
    exerciseId: weighted.id, setCount: 2, targetValue: 10, weight: 100, weightUnit: 'kg',
  });
  const underTarget = await createExercise(cookie, {
    name: 'Overweight Partial Reps', resistanceType: 'WEIGHTED', targetType: 'REPETITIONS',
  });
  await addPlannedExercise(cookie, plan.id, day.id, {
    exerciseId: underTarget.id, setCount: 1, targetValue: 10, weight: 100, weightUnit: 'kg',
  });
  const started = await request('/api/workout-sessions', {
    method: 'POST', headers: { cookie },
    body: JSON.stringify({ workoutDayId: day.id, timeZone: 'Asia/Shanghai' }),
  });
  assert.equal(started.status, 201);
  const session = (await started.json()).workoutSession;
  const sessionExercise = session.exercises.find((item) => item.exerciseId === weighted.id);
  const underTargetSessionExercise = session.exercises.find((item) => item.exerciseId === underTarget.id);
  assert.ok(sessionExercise);
  assert.ok(underTargetSessionExercise);

  const firstSet = await request(`/api/workout-sessions/${session.id}/exercises/${sessionExercise.id}/sets/1`, {
    method: 'PUT', headers: { cookie },
    body: JSON.stringify({ actualValue: 12, actualWeight: 110, weightUnit: 'kg' }),
  });
  assert.equal(firstSet.status, 200);

  const partialWeightSet = await request(`/api/workout-sessions/${session.id}/exercises/${underTargetSessionExercise.id}/sets/1`, {
    method: 'PUT', headers: { cookie },
    body: JSON.stringify({ actualValue: 8, actualWeight: 110, weightUnit: 'kg' }),
  });
  assert.equal(partialWeightSet.status, 200);

  const paused = await request(`/api/workout-sessions/${session.id}/pause`, {
    method: 'POST', headers: { cookie }, body: '{}',
  });
  assert.equal(paused.status, 200);
  const blockedWhilePaused = await request(`/api/workout-sessions/${session.id}/exercises/${sessionExercise.id}/sets/2`, {
    method: 'PUT', headers: { cookie }, body: JSON.stringify({ skipped: true }),
  });
  assert.equal(blockedWhilePaused.status, 409);
  await request(`/api/workout-sessions/${session.id}/resume`, { method: 'POST', headers: { cookie }, body: '{}' });

  const skippedSet = await request(`/api/workout-sessions/${session.id}/exercises/${sessionExercise.id}/sets/2`, {
    method: 'PUT', headers: { cookie }, body: JSON.stringify({ skipped: true }),
  });
  assert.equal(skippedSet.status, 200);

  const duration = await createExercise(cookie, {
    name: 'Plank', resistanceType: 'BODYWEIGHT', targetType: 'DURATION',
  });
  const incompleteAdded = await request(`/api/workout-sessions/${session.id}/exercises`, {
    method: 'POST', headers: { cookie },
    body: JSON.stringify({ exerciseId: duration.id, setCount: 1 }),
  });
  assert.equal(incompleteAdded.status, 400);
  const addedResponse = await request(`/api/workout-sessions/${session.id}/exercises`, {
    method: 'POST', headers: { cookie },
    body: JSON.stringify({ exerciseId: duration.id, setCount: 1, targetValue: 30 }),
  });
  assert.equal(addedResponse.status, 201);
  const added = (await addedResponse.json()).sessionExercise;
  assert.equal(added.source, 'ADDED');
  const removed = await request(`/api/workout-sessions/${session.id}/exercises/${added.id}`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(removed.status, 204);

  const completed = await request(`/api/workout-sessions/${session.id}/complete`, {
    method: 'POST', headers: { cookie }, body: '{}',
  });
  assert.equal(completed.status, 200);
  assert.deepEqual((await completed.json()).exerciseResults, [{
    sessionExerciseId: sessionExercise.id,
    exerciseId: weighted.id,
    exerciseName: 'Deadlift',
    achievementRate: 50,
    excessTargetValue: 2,
    excessWeightGrams: 10_000,
  }, {
    sessionExerciseId: underTargetSessionExercise.id,
    exerciseId: underTarget.id,
    exerciseName: 'Overweight Partial Reps',
    achievementRate: 80,
    excessTargetValue: 0,
    excessWeightGrams: 0,
  }]);
});

test('User edits plan structure and permanently deletes an Exercise', async () => {
  const cookie = await signUp('PlanEditor');
  const plan = await createPlan(cookie, 'Editable Plan');
  const exercise = await createExercise(cookie, {
    name: 'Front Squat', resistanceType: 'WEIGHTED', targetType: 'REPETITIONS',
  });
  const day = await createWorkoutDay(cookie, plan.id, 'Leg Day');
  const planned = await addPlannedExercise(cookie, plan.id, day.id, {
    exerciseId: exercise.id, setCount: 3, targetValue: 8, weight: 80, weightUnit: 'kg',
  });

  const renamedPlan = await request(`/api/plans/${plan.id}`, {
    method: 'PATCH', headers: { cookie }, body: JSON.stringify({ name: 'Edited Plan' }),
  });
  assert.equal(renamedPlan.status, 200);

  const updatedDay = await request(`/api/plans/${plan.id}/days/${day.id}`, {
    method: 'PATCH', headers: { cookie },
    body: JSON.stringify({ name: 'Heavy Leg Day', suggestedWeekday: 4 }),
  });
  assert.equal(updatedDay.status, 200);

  const updatedPlanned = await request(`/api/plans/${plan.id}/days/${day.id}/exercises/${planned.id}`, {
    method: 'PATCH', headers: { cookie },
    body: JSON.stringify({ setCount: 4, targetValue: 6, weight: 85, weightUnit: 'kg' }),
  });
  assert.equal(updatedPlanned.status, 200);
  assert.deepEqual(await updatedPlanned.json(), {
    plannedExercise: {
      id: planned.id,
      exerciseId: exercise.id,
      setCount: 4,
      targetValue: 6,
      weightGrams: 85_000,
    },
  });

  const plansBody = await request('/api/plans', { headers: { cookie } });
  assert.equal(plansBody.status, 200);
  const [savedPlan] = (await plansBody.json()).plans;
  assert.equal(savedPlan.name, 'Edited Plan');
  assert.equal(savedPlan.workoutDays[0].name, 'Heavy Leg Day');
  assert.equal(savedPlan.workoutDays[0].suggestedWeekday, 4);
  assert.equal(savedPlan.workoutDays[0].plannedExercises[0].exercise.name, 'Front Squat');

  const impact = await request(`/api/exercises/${exercise.id}`, { headers: { cookie } });
  assert.equal(impact.status, 200);
  assert.deepEqual((await impact.json()).exercise.plannedExerciseCount, 1);

  const removedPlanned = await request(`/api/plans/${plan.id}/days/${day.id}/exercises/${planned.id}`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(removedPlanned.status, 204);

  const removedDay = await request(`/api/plans/${plan.id}/days/${day.id}`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(removedDay.status, 204);

  const unconfirmedDelete = await request(`/api/exercises/${exercise.id}`, {
    method: 'DELETE', headers: { cookie }, body: JSON.stringify({}),
  });
  assert.equal(unconfirmedDelete.status, 400);

  const deletedExercise = await request(`/api/exercises/${exercise.id}`, {
    method: 'DELETE', headers: { cookie }, body: JSON.stringify({ confirmation: 'DELETE' }),
  });
  assert.equal(deletedExercise.status, 204);
  assert.deepEqual(await (await request('/api/exercises', { headers: { cookie } })).json(), { exercises: [] });
});

test('A Workout Day without Planned Exercises cannot start a Session', async () => {
  const cookie = await signUp('EmptyDay');
  const plan = await createPlan(cookie, 'Empty Plan');
  const day = await createWorkoutDay(cookie, plan.id, 'Empty Day');

  const started = await request('/api/workout-sessions', {
    method: 'POST', headers: { cookie },
    body: JSON.stringify({ workoutDayId: day.id, timeZone: 'Asia/Shanghai' }),
  });
  assert.equal(started.status, 409);
  const active = await request('/api/workout-sessions/active', { headers: { cookie } });
  assert.equal(active.status, 200);
  assert.equal((await active.json()).workoutSession, null);
});
