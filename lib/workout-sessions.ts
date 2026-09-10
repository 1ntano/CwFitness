import { prisma } from "@/lib/prisma";

export const maxHeartbeatIntervalMs = 5 * 60 * 1000;

export function heartbeatIsStale(lastHeartbeatAt: Date | null, now: Date) {
  return lastHeartbeatAt !== null && now.getTime() - lastHeartbeatAt.getTime() > maxHeartbeatIntervalMs;
}

export function confirmedActiveDurationMs(lastHeartbeatAt: Date | null, now: Date) {
  if (!lastHeartbeatAt) return 0;
  return Math.min(maxHeartbeatIntervalMs, Math.max(0, now.getTime() - lastHeartbeatAt.getTime()));
}

export type ExerciseResult = {
  sessionExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  achievementRate: number;
  excessTargetValue: number;
  excessWeightGrams: number;
};

type ScoredExercise = {
  id: string;
  exerciseId: string;
  resistanceType: "WEIGHTED" | "BODYWEIGHT";
  setCount: number;
  targetValue: number;
  weightGrams: number | null;
  exercise: { name: string };
  setResults: Array<{ setIndex: number; actualValue: number | null; actualWeightGrams: number | null; skipped: boolean }>;
};

export function scoreExercises(exercises: ScoredExercise[]): ExerciseResult[] {
  return exercises.map((exercise) => {
    const results = new Map(exercise.setResults.map((result) => [result.setIndex, result]));
    let scoreTotal = 0;
    let excessTargetValue = 0;
    let excessWeightGrams = 0;
    for (let index = 1; index <= exercise.setCount; index += 1) {
      const result = results.get(index);
      if (!result || result.skipped || result.actualValue === null) continue;
      const targetRatio = result.actualValue / exercise.targetValue;
      const weightRatio = exercise.resistanceType === "WEIGHTED" && exercise.weightGrams
        ? (result.actualWeightGrams ?? 0) / exercise.weightGrams
        : targetRatio;
      scoreTotal += Math.min(1, targetRatio, weightRatio);
      const targetReached = result.actualValue >= exercise.targetValue;
      const weightReached = exercise.resistanceType !== "WEIGHTED" ||
        (exercise.weightGrams !== null && result.actualWeightGrams !== null && result.actualWeightGrams >= exercise.weightGrams);
      if (targetReached && weightReached) {
        excessTargetValue += result.actualValue - exercise.targetValue;
        if (exercise.weightGrams && result.actualWeightGrams) excessWeightGrams += Math.max(0, result.actualWeightGrams - exercise.weightGrams);
      }
    }
    return { sessionExerciseId: exercise.id, exerciseId: exercise.exerciseId, exerciseName: exercise.exercise.name, achievementRate: Math.round((scoreTotal / exercise.setCount) * 100), excessTargetValue, excessWeightGrams };
  });
}

export const workoutSessionSelect = {
  id: true,
  status: true,
  timeZone: true,
  localStartDate: true,
  startedAt: true,
  pausedAt: true,
  completedAt: true,
  trainingTimeSeconds: true,
  lastHeartbeatAt: true,
  exercises: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      exerciseId: true,
      exerciseName: true,
      resistanceType: true,
      targetType: true,
      setCount: true,
      targetValue: true,
      weightGrams: true,
      source: true,
      removedAt: true,
      setResults: {
        orderBy: { setIndex: "asc" as const },
        select: {
          setIndex: true,
          actualValue: true,
          actualWeightGrams: true,
          skipped: true,
        },
      },
    },
  },
};

export const workoutSessionHistorySelect = {
  ...workoutSessionSelect,
  workoutPlanName: true,
  workoutDayName: true,
  exercises: {
    orderBy: { createdAt: "asc" as const },
    select: {
      ...workoutSessionSelect.exercises.select,
      exercise: { select: { name: true } },
    },
  },
};

export async function ownedSession(userId: string, sessionId: string) {
  return prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    select: { ...workoutSessionSelect, pausedDurationMs: true, activeDurationMs: true },
  });
}
