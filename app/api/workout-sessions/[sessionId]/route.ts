import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { workoutSessionHistorySelect } from "@/lib/workout-sessions";

export async function DELETE(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version || body?.confirmation !== "DELETE") {
    return Response.json({ error: "Deletion confirmation is required" }, { status: 400 });
  }

  const current = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id, status: "COMPLETED" },
    select: workoutSessionHistorySelect,
  });
  if (!current) return Response.json({ error: "Completed Workout Session not found" }, { status: 404 });
  if (current.version !== version) return versionConflict(current, "Workout Session changed on another device");

  const deleted = await prisma.workoutSession.deleteMany({
    where: { id: sessionId, userId: session.user.id, status: "COMPLETED", version },
  });
  if (deleted.count === 1) return new Response(null, { status: 204 });

  const latest = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    select: workoutSessionHistorySelect,
  });
  return latest
    ? versionConflict(latest, "Workout Session changed on another device")
    : Response.json({ error: "Completed Workout Session not found" }, { status: 404 });
}
