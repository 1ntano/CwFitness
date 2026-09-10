import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedSession, workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const current = await ownedSession(authSession.user.id, sessionId);
  if (!current || current.status !== "PAUSED" || !current.pausedAt) {
    return Response.json({ error: "Paused Workout Session not found" }, { status: 404 });
  }
  const pausedDurationMs = current.pausedDurationMs + Math.max(0, Date.now() - current.pausedAt.getTime());
  const workoutSession = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { status: "ACTIVE", pausedAt: null, pausedDurationMs },
    select: workoutSessionSelect,
  });
  return Response.json({ workoutSession });
}

