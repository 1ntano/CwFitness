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
    },
  },
};

export async function ownedSession(userId: string, sessionId: string) {
  return prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    select: { ...workoutSessionSelect, pausedDurationMs: true },
  });
}
