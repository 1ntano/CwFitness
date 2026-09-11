import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, sessionUnavailable, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { workoutSessionSelect } from "@/lib/workout-sessions";

export async function PUT(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  const exerciseIds = Array.isArray(body?.exerciseIds)
    ? body.exerciseIds.filter((id): id is string => typeof id === "string")
    : null;
  if (!version || !exerciseIds || exerciseIds.length === 0 || new Set(exerciseIds).size !== exerciseIds.length) {
    return Response.json({ error: "A complete ordered Exercise list is required" }, { status: 400 });
  }

  const current = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id, status: "ACTIVE" },
    select: {
      id: true,
      version: true,
      editingDeviceId: true,
      exercises: {
        where: { removedAt: null },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      },
    },
  });
  if (!current) return Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  if (current.editingDeviceId !== session.session.id) {
    return sessionUnavailable(current, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }

  const currentIds = current.exercises.map((exercise) => exercise.id);
  const sameOrder = currentIds.length === exerciseIds.length && currentIds.every((id, index) => id === exerciseIds[index]);
  if (sameOrder) {
    const workoutSession = await prisma.workoutSession.findUniqueOrThrow({ where: { id: sessionId }, select: workoutSessionSelect });
    return Response.json({ workoutSession });
  }
  if (!currentIds.every((id) => exerciseIds.includes(id))) {
    return Response.json({ error: "Order must contain every active Session Exercise exactly once" }, { status: 400 });
  }
  if (current.version !== version) return versionConflict(current, "Workout Session changed on another device");

  const workoutSession = await prisma.$transaction(async (tx) => {
    const lease = await tx.workoutSession.updateMany({
      where: { id: sessionId, userId: session.user.id, status: "ACTIVE", version, editingDeviceId: session.session.id },
      data: { version: { increment: 1 } },
    });
    if (lease.count === 0) return null;
    for (const [position, exerciseId] of exerciseIds.entries()) {
      await tx.sessionExercise.updateMany({
        where: { id: exerciseId, workoutSessionId: sessionId, removedAt: null },
        data: { position },
      });
    }
    return tx.workoutSession.findUniqueOrThrow({ where: { id: sessionId }, select: workoutSessionSelect });
  });
  if (!workoutSession) {
    const latest = await prisma.workoutSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { id: true, status: true, version: true, editingDeviceId: true },
    });
    return latest.editingDeviceId !== session.session.id
      ? sessionUnavailable(latest, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device")
      : versionConflict(latest, "Workout Session changed on another device");
  }
  return Response.json({ workoutSession });
}
