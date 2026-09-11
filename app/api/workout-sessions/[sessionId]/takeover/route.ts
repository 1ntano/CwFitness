import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { workoutSessionSelect } from "@/lib/workout-sessions";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });

  const current = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] } },
    select: { id: true, editingDeviceId: true, version: true },
  });
  if (!current) return Response.json({ error: "In-progress Workout Session not found" }, { status: 404 });
  if (current.version !== version) return versionConflict(current, "Workout Session changed on another device");
  if (current.editingDeviceId === session.session.id) {
    const workoutSession = await prisma.workoutSession.findUniqueOrThrow({ where: { id: sessionId }, select: workoutSessionSelect });
    return Response.json({ workoutSession });
  }

  const result = await prisma.workoutSession.updateMany({
    where: { id: sessionId, userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] }, version },
    data: { editingDeviceId: session.session.id, version: { increment: 1 } },
  });
  if (result.count === 0) {
    const latest = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] } },
      select: { id: true, editingDeviceId: true, version: true },
    });
    return latest
      ? versionConflict(latest, "Workout Session changed on another device")
      : Response.json({ error: "In-progress Workout Session not found" }, { status: 409 });
  }
  const workoutSession = await prisma.workoutSession.findUniqueOrThrow({ where: { id: sessionId }, select: workoutSessionSelect });
  return Response.json({ workoutSession });
}
