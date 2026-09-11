import { getVerifiedSession } from "@/lib/auth";
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
      select: { activeDurationMs: true, lastHeartbeatAt: true },
    });
    if (!current) return null;
    if (heartbeatIsStale(current.lastHeartbeatAt, now)) {
      await tx.workoutSession.update({ where: { id: sessionId }, data: { status: "PAUSED", pausedAt: now, lastHeartbeatAt: null } });
      return { stale: true };
    }
    await tx.workoutSession.update({
      where: { id: sessionId },
      data: { activeDurationMs: current.activeDurationMs + confirmedActiveDurationMs(current.lastHeartbeatAt, now), lastHeartbeatAt: now },
    });
    return { stale: false };
  });
  if (!workoutSession) return Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  if (workoutSession.stale) return Response.json({ error: "Workout Session was paused after an inactive period" }, { status: 409 });
  return new Response(null, { status: 204 });
}
