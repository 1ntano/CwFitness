import { prisma } from "@/lib/prisma";

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
  version: true,
  editingDeviceId: true,
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
