"use client";

import type { Exercise, SessionExercise, WorkoutSession } from "./workout-types";

export type SessionMutation =
  | {
      kind: "set";
      operationId: string;
      sessionExerciseId: string;
      setIndex: number;
      result: { actualValue: number | null; actualWeightGrams: number | null; skipped: boolean };
    }
  | { kind: "add-exercise"; operationId: string; exercise: SessionExercise }
  | { kind: "remove-exercise"; operationId: string; sessionExerciseId: string }
  | { kind: "reorder-exercises"; operationId: string; exerciseIds: string[] };

export type NewSessionMutation = SessionMutation & {
  request: { method: "PUT" | "POST" | "DELETE"; path: string; body: string };
};

export type QueuedSessionMutation = NewSessionMutation & {
  userId: string;
  sequence?: number;
  createdAt: string;
};

export type WorkoutSessionDraft = {
  session: WorkoutSession;
  exercises: Exercise[];
  settings: { timeZone: string; weightUnit: "kg" | "lb" };
};

const databaseName = "cwfitness-workout-outbox";
const databaseVersion = 2;
const draftStoreName = "draft";
const operationStoreName = "operations";

function draftKey(userId: string) {
  return `user:${userId}:active`;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(draftStoreName)) {
        database.createObjectStore(draftStoreName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(operationStoreName)) {
        const operations = database.createObjectStore(operationStoreName, { keyPath: "sequence", autoIncrement: true });
        operations.createIndex("operationId", "operationId", { unique: true });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function store(name: string, mode: IDBTransactionMode) {
  const database = await openDatabase();
  return database.transaction(name, mode).objectStore(name);
}

export async function saveWorkoutSessionDraft(userId: string, draft: WorkoutSessionDraft) {
  const target = await store(draftStoreName, "readwrite");
  return new Promise<void>((resolve, reject) => {
    target.put({ id: draftKey(userId), userId, ...draft });
    target.transaction.oncomplete = () => resolve();
    target.transaction.onerror = () => reject(target.transaction.error);
  });
}

export async function loadWorkoutSessionDraft(userId: string) {
  const source = await store(draftStoreName, "readonly");
  return new Promise<WorkoutSessionDraft | null>((resolve, reject) => {
    const request = source.get(draftKey(userId));
    request.onsuccess = () => {
      const stored = request.result as (WorkoutSessionDraft & { id: string; userId: string }) | undefined;
      if (!stored || stored.userId !== userId) return resolve(null);
      const draft: WorkoutSessionDraft & { id?: string; userId?: string } = { ...stored };
      delete draft.id;
      delete draft.userId;
      resolve(draft);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearWorkoutSessionDraft(userId: string) {
  const target = await store(draftStoreName, "readwrite");
  return new Promise<void>((resolve, reject) => {
    target.delete(draftKey(userId));
    target.transaction.oncomplete = () => resolve();
    target.transaction.onerror = () => reject(target.transaction.error);
  });
}

export async function enqueueSessionMutation(userId: string, mutation: NewSessionMutation) {
  const target = await store(operationStoreName, "readwrite");
  return new Promise<void>((resolve, reject) => {
    target.add({ ...mutation, userId, createdAt: new Date().toISOString() });
    target.transaction.oncomplete = () => resolve();
    target.transaction.onerror = () => reject(target.transaction.error);
  });
}

export async function clearWorkoutSessionOutbox(userId?: string) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([draftStoreName, operationStoreName], "readwrite");
    if (!userId) {
      transaction.objectStore(draftStoreName).clear();
      transaction.objectStore(operationStoreName).clear();
    } else {
      transaction.objectStore(draftStoreName).delete(draftKey(userId));
      const operations = transaction.objectStore(operationStoreName);
      const request = operations.getAll();
      request.onsuccess = () => {
        for (const mutation of request.result as QueuedSessionMutation[]) {
          if (mutation.userId === userId && typeof mutation.sequence === "number") operations.delete(mutation.sequence);
        }
      };
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function queuedSessionMutations(userId: string) {
  const source = await store(operationStoreName, "readonly");
  return new Promise<QueuedSessionMutation[]>((resolve, reject) => {
    const request = source.getAll();
    request.onsuccess = () => resolve((request.result as QueuedSessionMutation[])
      .filter((mutation) => mutation.userId === userId)
      .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0)));
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedSessionMutation(userId: string, operationId: string) {
  const source = await store(operationStoreName, "readwrite");
  const index = source.index("operationId");
  return new Promise<void>((resolve, reject) => {
    const request = index.getKey(operationId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const sequence = request.result;
      if (typeof sequence !== "number") return resolve();
      const mutation = source.get(sequence);
      mutation.onerror = () => reject(mutation.error);
      mutation.onsuccess = () => {
        if ((mutation.result as QueuedSessionMutation | undefined)?.userId === userId) source.delete(sequence);
        source.transaction.oncomplete = () => resolve();
        source.transaction.onerror = () => reject(source.transaction.error);
      };
    };
  });
}

export function applySessionMutation(session: WorkoutSession, mutation: SessionMutation): WorkoutSession {
  const next = structuredClone(session);
  if (mutation.kind === "set") {
    const exercise = next.exercises.find((item) => item.id === mutation.sessionExerciseId);
    if (!exercise) return next;
    exercise.setResults = [
      ...exercise.setResults.filter((result) => result.setIndex !== mutation.setIndex),
      { setIndex: mutation.setIndex, ...mutation.result },
    ].sort((left, right) => left.setIndex - right.setIndex);
    return next;
  }
  if (mutation.kind === "add-exercise") {
    next.exercises.push({ ...mutation.exercise, position: next.exercises.length });
    next.version += 1;
    return next;
  }
  if (mutation.kind === "remove-exercise") {
    const exercise = next.exercises.find((item) => item.id === mutation.sessionExerciseId);
    if (exercise) exercise.removedAt = new Date().toISOString();
    next.version += 1;
    return next;
  }

  const positions = new Map(mutation.exerciseIds.map((id, index) => [id, index]));
  next.exercises.sort((left, right) => (positions.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  next.exercises.forEach((exercise, index) => {
    exercise.position = index;
  });
  next.version += 1;
  return next;
}

export async function replaySessionMutations(userId: string, send: (mutation: QueuedSessionMutation) => Promise<void>) {
  const mutations = await queuedSessionMutations(userId);
  for (const mutation of mutations) {
    try {
      await send(mutation);
      await removeQueuedSessionMutation(userId, mutation.operationId);
    } catch (error) {
      return { ok: false as const, error, remaining: await queuedSessionMutations(userId) };
    }
  }
  return { ok: true as const, remaining: [] };
}
