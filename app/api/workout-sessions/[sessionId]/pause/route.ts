import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, sessionUnavailable, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { confirmedActiveDurationMs } from "@/lib/workout-session-domain";
import { ownedSession, workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await getVerifiedSession(request);
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });
  const current = await ownedSession(authSession.user.id, sessionId);
  if (!current || current.status !== "ACTIVE") return Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  if (current.editingDeviceId !== authSession.session.id) {
    return sessionUnavailable(current, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  if (current.version !== version) return versionConflict(current, "Workout Session changed on another device");

  const now = new Date();
  const workoutSession = await prisma.$transaction(async (tx) => {
    const result = await tx.workoutSession.updateMany({
      where: { id: sessionId, userId: authSession.user.id, status: "ACTIVE", version, editingDeviceId: authSession.session.id },
      data: {
        status: "PAUSED",
        pausedAt: now,
        activeDurationMs: current.activeDurationMs + confirmedActiveDurationMs(current.lastHeartbeatAt, now),
        lastHeartbeatAt: null,
        version: { increment: 1 },
      },
    });
    if (result.count === 0) return null;
    return tx.workoutSession.update({
      where: { id: sessionId },
      data: {},
      select: workoutSessionSelect,
    });
  });
  if (!workoutSession) {
    const latest = await ownedSession(authSession.user.id, sessionId);
    return latest
      ? versionConflict(latest, "Workout Session changed on another device")
      : Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  }
  return Response.json({ workoutSession });
}

