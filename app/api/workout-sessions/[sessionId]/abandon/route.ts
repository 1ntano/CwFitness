import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const result = await prisma.workoutSession.updateMany({ where: { id: sessionId, userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] } }, data: { status: "ABANDONED", pausedAt: null } });
  if (!result.count) return Response.json({ error: "In-progress Workout Session not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
