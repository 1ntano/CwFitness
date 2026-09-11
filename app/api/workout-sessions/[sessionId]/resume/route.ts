import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, sessionUnavailable, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { ownedSession, workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await getVerifiedSession(request);
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });
  const current = await ownedSession(authSession.user.id, sessionId);
  if (!current || current.status !== "PAUSED" || !current.pausedAt) {
    return Response.json({ error: "Paused Workout Session not found" }, { status: 404 });
  }
  if (current.editingDeviceId !== authSession.session.id) {
    return sessionUnavailable(current, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  if (current.version !== version) return versionConflict(current, "Workout Session changed on another device");

  const pausedDurationMs = current.pausedDurationMs + Math.max(0, Date.now() - current.pausedAt.getTime());
  const updated = await prisma.workoutSession.updateMany({
    where: { id: sessionId, userId: authSession.user.id, status: "PAUSED", version, editingDeviceId: authSession.session.id },
    data: { status: "ACTIVE", pausedAt: null, pausedDurationMs, lastHeartbeatAt: new Date(), version: { increment: 1 } },
  });
  if (updated.count === 0) {
    const latest = await ownedSession(authSession.user.id, sessionId);
    return latest
      ? versionConflict(latest, "Workout Session changed on another device")
      : Response.json({ error: "Paused Workout Session not found" }, { status: 404 });
  }
  const workoutSession = await prisma.workoutSession.findUniqueOrThrow({ where: { id: sessionId }, select: workoutSessionSelect });
  return Response.json({ workoutSession });
}

