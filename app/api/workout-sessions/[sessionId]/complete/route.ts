import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedSession, workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const current = await ownedSession(authSession.user.id, sessionId);
  if (!current || (current.status !== "ACTIVE" && current.status !== "PAUSED")) return Response.json({ error: "In-progress Session not found" }, { status: 404 });

  const completedAt = new Date();
  const finalPauseMs = current.status === "PAUSED" && current.pausedAt ? Math.max(0, completedAt.getTime() - current.pausedAt.getTime()) : 0;
  const pausedDurationMs = current.pausedDurationMs + finalPauseMs;
  const trainingTimeSeconds = Math.max(0, Math.floor((completedAt.getTime() - current.startedAt.getTime() - pausedDurationMs) / 1000));

  const scoredExercises = await prisma.sessionExercise.findMany({
    where: { workoutSessionId: sessionId, removedAt: null },
    orderBy: { createdAt: "asc" },
    include: { exercise: { select: { name: true } }, setResults: true },
  });
  const exerciseResults = scoredExercises.map((exercise) => {
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
      excessTargetValue += Math.max(0, result.actualValue - exercise.targetValue);
      if (exercise.weightGrams && result.actualWeightGrams) excessWeightGrams += Math.max(0, result.actualWeightGrams - exercise.weightGrams);
    }
    return {
      sessionExerciseId: exercise.id,
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exercise.name,
      achievementRate: Math.round((scoreTotal / exercise.setCount) * 100),
      excessTargetValue,
      excessWeightGrams,
    };
  });

  const workoutSession = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt, pausedAt: null, pausedDurationMs, trainingTimeSeconds },
    select: workoutSessionSelect,
  });
  return Response.json({ workoutSession, exerciseResults });
}
