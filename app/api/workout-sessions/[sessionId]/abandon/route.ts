import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, sessionUnavailable, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { ownedSession, workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });
  const current = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] } },
    select: workoutSessionSelect,
  });
  if (!current) return Response.json({ error: "In-progress Workout Session not found" }, { status: 404 });
  if (current.editingDeviceId !== session.session.id) {
    return sessionUnavailable(current, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  if (current.version !== version) return versionConflict(current, "Workout Session changed on another device");
  const result = await prisma.workoutSession.updateMany({
    where: { id: sessionId, userId: session.user.id, version, editingDeviceId: session.session.id, status: { in: ["ACTIVE", "PAUSED"] } },
    data: { status: "ABANDONED", pausedAt: null, editingDeviceId: null, version: { increment: 1 } },
  });
  if (!result.count) {
    const latest = await ownedSession(session.user.id, sessionId);
    return latest
      ? versionConflict(latest, "Workout Session changed on another device")
      : Response.json({ error: "In-progress Workout Session not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
