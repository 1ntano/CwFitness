import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, context: { params: Promise<{ sessionId: string; sessionExerciseId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId, sessionExerciseId } = await context.params;
  const result = await prisma.sessionExercise.updateMany({
    where: { id: sessionExerciseId, workoutSessionId: sessionId, removedAt: null, workoutSession: { userId: session.user.id, status: "ACTIVE" } },
    data: { removedAt: new Date() },
  });
  if (result.count === 0) return Response.json({ error: "Active Session Exercise not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
