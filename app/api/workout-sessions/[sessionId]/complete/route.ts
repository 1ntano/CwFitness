import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmedActiveDurationMs, scoreExercises } from "@/lib/workout-session-domain";
import { ownedSession, workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await getVerifiedSession(request);
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const current = await ownedSession(authSession.user.id, sessionId);
  if (!current || (current.status !== "ACTIVE" && current.status !== "PAUSED")) return Response.json({ error: "In-progress Session not found" }, { status: 404 });

  const completedAt = new Date();
  const finalPauseMs = current.status === "PAUSED" && current.pausedAt ? Math.max(0, completedAt.getTime() - current.pausedAt.getTime()) : 0;
  const pausedDurationMs = current.pausedDurationMs + finalPauseMs;
  const activeDurationMs = current.activeDurationMs + (current.status === "ACTIVE" ? confirmedActiveDurationMs(current.lastHeartbeatAt, completedAt) : 0);
  const trainingTimeSeconds = Math.max(0, Math.floor(activeDurationMs / 1000));

  const sessionExercises = await prisma.sessionExercise.findMany({
    where: { workoutSessionId: sessionId, removedAt: null },
    orderBy: { createdAt: "asc" },
    include: { exercise: { select: { name: true } }, setResults: true },
  });
  if (sessionExercises.length === 0) {
    return Response.json(
      { error: "A Workout Session must contain at least one Exercise" },
      { status: 409 },
    );
  }
  const missingSets = sessionExercises.flatMap((exercise) => {
    const recorded = new Set(exercise.setResults.map((result) => result.setIndex));
    return Array.from({ length: exercise.setCount }, (_, index) => index + 1)
      .filter((setIndex) => !recorded.has(setIndex))
      .map((setIndex) => ({ sessionExerciseId: exercise.id, setIndex }));
  });
  if (missingSets.length > 0) {
    await prisma.$transaction(missingSets.map((set) => prisma.sessionSetResult.upsert({
      where: { sessionExerciseId_setIndex: set },
      create: { ...set, actualValue: null, actualWeightGrams: null, skipped: true },
      update: { actualValue: null, actualWeightGrams: null, skipped: true },
    })));
  }
  const scoredExercises = missingSets.length === 0 ? sessionExercises : await prisma.sessionExercise.findMany({
    where: { workoutSessionId: sessionId, removedAt: null },
    orderBy: { createdAt: "asc" },
    include: { exercise: { select: { name: true } }, setResults: true },
  });
  const exerciseResults = scoreExercises(scoredExercises);

  const workoutSession = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt, pausedAt: null, pausedDurationMs, activeDurationMs, lastHeartbeatAt: null, trainingTimeSeconds },
    select: workoutSessionSelect,
  });
  return Response.json({ workoutSession, exerciseResults });
}
