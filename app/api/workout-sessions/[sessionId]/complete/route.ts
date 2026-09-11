import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, sessionUnavailable, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { confirmedActiveDurationMs, scoreExercises } from "@/lib/workout-session-domain";
import { ownedSession, workoutSessionSelect } from "@/lib/workout-sessions";

class EmptySessionError extends Error {}

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await getVerifiedSession(request);
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });
  const current = await ownedSession(authSession.user.id, sessionId);
  if (!current || (current.status !== "ACTIVE" && current.status !== "PAUSED")) return Response.json({ error: "In-progress Session not found" }, { status: 404 });
  if (current.editingDeviceId !== authSession.session.id) {
    return sessionUnavailable(current, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  if (current.version !== version) return versionConflict(current, "Workout Session changed on another device");

  const completedAt = new Date();
  const finalPauseMs = current.status === "PAUSED" && current.pausedAt ? Math.max(0, completedAt.getTime() - current.pausedAt.getTime()) : 0;
  const pausedDurationMs = current.pausedDurationMs + finalPauseMs;
  const activeDurationMs = current.activeDurationMs + (current.status === "ACTIVE" ? confirmedActiveDurationMs(current.lastHeartbeatAt, completedAt) : 0);
  const trainingTimeSeconds = Math.max(0, Math.floor(activeDurationMs / 1000));

  try {
    const completion = await prisma.$transaction(async (tx) => {
      const result = await tx.workoutSession.updateMany({
        where: { id: sessionId, userId: authSession.user.id, version, editingDeviceId: authSession.session.id },
        data: {
          status: "COMPLETED",
          completedAt,
          pausedAt: null,
          pausedDurationMs,
          activeDurationMs,
          lastHeartbeatAt: null,
          trainingTimeSeconds,
          editingDeviceId: null,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) return null;

      const sessionExercises = await tx.sessionExercise.findMany({
        where: { workoutSessionId: sessionId, removedAt: null },
        orderBy: { createdAt: "asc" },
        include: { exercise: { select: { name: true } }, setResults: true },
      });
      if (sessionExercises.length === 0) throw new EmptySessionError();

      const missingSets = sessionExercises.flatMap((exercise) => {
        const recorded = new Set(exercise.setResults.map((setResult) => setResult.setIndex));
        return Array.from({ length: exercise.setCount }, (_, index) => index + 1)
          .filter((setIndex) => !recorded.has(setIndex))
          .map((setIndex) => ({ sessionExerciseId: exercise.id, setIndex }));
      });
      for (const set of missingSets) {
        await tx.sessionSetResult.upsert({
          where: { sessionExerciseId_setIndex: set },
          create: { ...set, actualValue: null, actualWeightGrams: null, skipped: true },
          update: { actualValue: null, actualWeightGrams: null, skipped: true },
        });
      }

      const scoredExercises = missingSets.length === 0
        ? sessionExercises
        : await tx.sessionExercise.findMany({
            where: { workoutSessionId: sessionId, removedAt: null },
            orderBy: { createdAt: "asc" },
            include: { exercise: { select: { name: true } }, setResults: true },
          });
      const workoutSession = await tx.workoutSession.findUniqueOrThrow({ where: { id: sessionId }, select: workoutSessionSelect });
      return { workoutSession, exerciseResults: scoreExercises(scoredExercises) };
    });

    if (!completion) {
      const latest = await ownedSession(authSession.user.id, sessionId);
      return latest
        ? versionConflict(latest, "Workout Session changed on another device")
        : Response.json({ error: "In-progress Session not found" }, { status: 404 });
    }
    return Response.json(completion);
  } catch (error) {
    if (!(error instanceof EmptySessionError)) throw error;
    return Response.json(
      { error: "A Workout Session must contain at least one Exercise" },
      { status: 409 },
    );
  }
}
