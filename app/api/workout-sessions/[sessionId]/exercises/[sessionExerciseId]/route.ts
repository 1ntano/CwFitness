import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, sessionUnavailable, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, context: { params: Promise<{ sessionId: string; sessionExerciseId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId, sessionExerciseId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true, version: true, editingDeviceId: true },
  });
  if (!workoutSession) return Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  if (workoutSession.editingDeviceId !== session.session.id) {
    return sessionUnavailable(workoutSession, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  if (workoutSession.version !== version) return versionConflict(workoutSession, "Workout Session changed on another device");

  const result = await prisma.$transaction(async (tx) => {
    const lease = await tx.workoutSession.updateMany({
      where: { id: sessionId, userId: session.user.id, status: "ACTIVE", version, editingDeviceId: session.session.id },
      data: { version: { increment: 1 } },
    });
    if (lease.count === 0) return null;
    return tx.sessionExercise.updateMany({
      where: { id: sessionExerciseId, workoutSessionId: sessionId, removedAt: null },
      data: { removedAt: new Date() },
    });
  });
  if (!result) {
    const latest = await prisma.workoutSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { id: true, status: true, version: true, editingDeviceId: true },
    });
    return sessionUnavailable(latest, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  if (result.count === 0) return Response.json({ error: "Active Session Exercise not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
