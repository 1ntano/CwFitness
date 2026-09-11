import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, sessionUnavailable, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { weightInGrams } from "@/lib/weights";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    select: { status: true, version: true, editingDeviceId: true },
  });
  if (!workoutSession) return Response.json({ error: "Workout Session not found" }, { status: 404 });
  if (workoutSession.status !== "ACTIVE") return Response.json({ error: "Session is not active" }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });
  if (workoutSession.editingDeviceId !== session.session.id) {
    return sessionUnavailable(workoutSession, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  if (workoutSession.version !== version) return versionConflict(workoutSession, "Workout Session changed on another device");
  const exerciseId = typeof body?.exerciseId === "string" ? body.exerciseId : "";
  const setCount = body?.setCount;
  const targetValue = body?.targetValue;
  if (!exerciseId || !Number.isInteger(setCount) || Number(setCount) < 1 || !Number.isInteger(targetValue) || Number(targetValue) < 1) return Response.json({ error: "Complete targets are required" }, { status: 400 });
  const exercise = await prisma.exercise.findFirst({ where: { id: exerciseId, userId: session.user.id } });
  if (!exercise) return Response.json({ error: "Exercise not found" }, { status: 404 });
  let weightGrams: number | null = null;
  if (exercise.resistanceType === "WEIGHTED") {
    weightGrams = weightInGrams(body?.weight, body?.weightUnit);
    if (weightGrams === null) return Response.json({ error: "Weight is required" }, { status: 400 });
  } else if (body?.weight !== undefined || body?.weightUnit !== undefined) return Response.json({ error: "Bodyweight Exercise cannot have weight" }, { status: 400 });
  const sessionExercise = await prisma.$transaction(async (tx) => {
    const lease = await tx.workoutSession.updateMany({
      where: { id: sessionId, userId: session.user.id, status: "ACTIVE", version, editingDeviceId: session.session.id },
      data: { version: { increment: 1 } },
    });
    if (lease.count === 0) return null;
    return tx.sessionExercise.create({
      data: { workoutSessionId: sessionId, exerciseId, exerciseName: exercise.name, resistanceType: exercise.resistanceType, targetType: exercise.targetType, setCount: Number(setCount), targetValue: Number(targetValue), weightGrams, source: "ADDED" },
      select: { id: true, exerciseId: true, exerciseName: true, resistanceType: true, targetType: true, setCount: true, targetValue: true, weightGrams: true, source: true },
    });
  });
  if (!sessionExercise) {
    const latest = await prisma.workoutSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { id: true, status: true, version: true, editingDeviceId: true },
    });
    return sessionUnavailable(latest, "SESSION_TAKEN_OVER", "Workout Session is being edited on another device");
  }
  return Response.json({ sessionExercise }, { status: 201 });
}
