import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmedActiveDurationMs } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const now = new Date();
  const workoutSession = await prisma.$transaction(async (tx) => {
    const current = await tx.workoutSession.findFirst({
      where: { id: sessionId, userId: session.user.id, status: "ACTIVE" },
      select: { activeDurationMs: true, lastHeartbeatAt: true },
    });
    if (!current) return null;
    return tx.workoutSession.update({
      where: { id: sessionId },
      data: { activeDurationMs: current.activeDurationMs + confirmedActiveDurationMs(current.lastHeartbeatAt, now), lastHeartbeatAt: now },
    });
  });
  if (!workoutSession) return Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
