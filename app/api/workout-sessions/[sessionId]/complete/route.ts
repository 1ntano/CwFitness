import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmedActiveDurationMs, ownedSession, scoreExercises, workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const current = await ownedSession(authSession.user.id, sessionId);
  if (!current || (current.status !== "ACTIVE" && current.status !== "PAUSED")) return Response.json({ error: "In-progress Session not found" }, { status: 404 });

  const completedAt = new Date();
  const finalPauseMs = current.status === "PAUSED" && current.pausedAt ? Math.max(0, completedAt.getTime() - current.pausedAt.getTime()) : 0;
  const pausedDurationMs = current.pausedDurationMs + finalPauseMs;
  const activeDurationMs = current.activeDurationMs + (current.status === "ACTIVE" ? confirmedActiveDurationMs(current.lastHeartbeatAt, completedAt) : 0);
  const trainingTimeSeconds = Math.max(0, Math.floor(activeDurationMs / 1000));

  const scoredExercises = await prisma.sessionExercise.findMany({
    where: { workoutSessionId: sessionId, removedAt: null },
    orderBy: { createdAt: "asc" },
    include: { exercise: { select: { name: true } }, setResults: true },
  });
  if (scoredExercises.length === 0) {
    return Response.json(
      { error: "A Workout Session must contain at least one Exercise" },
      { status: 409 },
    );
  }
  const exerciseResults = scoreExercises(scoredExercises);

  const workoutSession = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt, pausedAt: null, pausedDurationMs, activeDurationMs, lastHeartbeatAt: null, trainingTimeSeconds },
    select: workoutSessionSelect,
  });
  return Response.json({ workoutSession, exerciseResults });
}
