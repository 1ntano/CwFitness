import { getVerifiedSession } from "@/lib/auth";
import { sessionUnavailable } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { confirmedActiveDurationMs, heartbeatIsStale } from "@/lib/workout-session-domain";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const now = new Date();
  const workoutSession = await prisma.$transaction(async (tx) => {
    const current = await tx.workoutSession.findFirst({
      where: { id: sessionId, userId: session.user.id, status: "ACTIVE" },
      select: { activeDurationMs: true, lastHeartbeatAt: true, version: true, editingDeviceId: true, status: true },
    });
    if (!current) return null;
    if (current.editingDeviceId !== session.session.id) return { unavailable: current };
    if (heartbeatIsStale(current.lastHeartbeatAt, now)) {
      const paused = await tx.workoutSession.updateMany({
        where: { id: sessionId, status: "ACTIVE", editingDeviceId: session.session.id },
        data: { status: "PAUSED", pausedAt: now, lastHeartbeatAt: null, version: { increment: 1 } },
      });
      if (paused.count === 0) return { unavailable: current };
      return { stale: true };
    }
    const updated = await tx.workoutSession.updateMany({
      where: { id: sessionId, status: "ACTIVE", editingDeviceId: session.session.id },
      data: { activeDurationMs: current.activeDurationMs + confirmedActiveDurationMs(current.lastHeartbeatAt, now), lastHeartbeatAt: now },
    });
    if (updated.count === 0) return { unavailable: current };
    return { stale: false };
  });
  if (!workoutSession) return Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  if ("unavailable" in workoutSession) return sessionUnavailable(workoutSession.unavailable, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  if (workoutSession.stale) return Response.json({ error: "Workout Session was paused after an inactive period" }, { status: 409 });
  return new Response(null, { status: 204 });
}
