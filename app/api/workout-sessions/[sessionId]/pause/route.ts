import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const result = await prisma.workoutSession.updateMany({
    where: { id: sessionId, userId: authSession.user.id, status: "ACTIVE" },
    data: { status: "PAUSED", pausedAt: new Date() },
  });
  if (result.count === 0) return Response.json({ error: "Active Workout Session not found" }, { status: 404 });
  const workoutSession = await prisma.workoutSession.findUniqueOrThrow({ where: { id: sessionId }, select: workoutSessionSelect });
  return Response.json({ workoutSession });
}

