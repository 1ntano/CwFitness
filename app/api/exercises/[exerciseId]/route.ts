import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: RouteContext<"/api/exercises/[exerciseId]">) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId } = await context.params;
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      resistanceType: true,
      targetType: true,
      version: true,
      _count: { select: { plannedExercises: true, sessionExercises: true } },
    },
  });
  if (!exercise) return Response.json({ error: "Exercise not found" }, { status: 404 });
  return Response.json({
    exercise: {
      id: exercise.id,
      name: exercise.name,
      resistanceType: exercise.resistanceType,
      targetType: exercise.targetType,
      version: exercise.version,
      plannedExerciseCount: exercise._count.plannedExercises,
      sessionExerciseCount: exercise._count.sessionExercises,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext<"/api/exercises/[exerciseId]">) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const version = requestedVersion(body?.version);
  if (!version || !name || name.length > 80) {
    return Response.json({ error: "Exercise name must contain 1 to 80 characters" }, { status: 400 });
  }

  const existing = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId: session.user.id },
    select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
  });
  if (!existing) return Response.json({ error: "Exercise not found" }, { status: 404 });
  if (existing.version !== version) return versionConflict(existing, "Exercise changed on another device");

  const result = await prisma.exercise.updateMany({
    where: { id: exerciseId, userId: session.user.id, version },
    data: { name, version: { increment: 1 } },
  });
  if (result.count === 0) {
    const latest = await prisma.exercise.findUniqueOrThrow({
      where: { id: exerciseId },
      select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
    });
    return versionConflict(latest, "Exercise changed on another device");
  }
  const exercise = await prisma.exercise.findUniqueOrThrow({
    where: { id: exerciseId },
    select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
  });
  return Response.json({ exercise });
}

export async function DELETE(request: Request, context: RouteContext<"/api/exercises/[exerciseId]">) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version || body?.confirmation !== "DELETE") {
    return Response.json({ error: "Deletion confirmation is required" }, { status: 400 });
  }

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId: session.user.id },
    select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
  });
  if (!exercise) return Response.json({ error: "Exercise not found" }, { status: 404 });
  if (exercise.version !== version) return versionConflict(exercise, "Exercise changed on another device");

  const result = await prisma.$transaction(async (tx) => {
    const lockedExercise = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "exercise"
      WHERE id = ${exerciseId} AND "userId" = ${session.user.id} AND version = ${version}
      FOR UPDATE
    `;
    if (lockedExercise.length === 0) return { missing: true as const };
    const inProgress = await tx.sessionExercise.findFirst({
      where: {
        exerciseId,
        workoutSession: {
          userId: session.user.id,
          status: { in: ["ACTIVE", "PAUSED"] },
        },
      },
      select: { id: true },
    });
    if (inProgress) return { blocked: true as const };
    const deleted = await tx.exercise.deleteMany({
      where: { id: exerciseId, userId: session.user.id, version },
    });
    return { deleted: deleted.count };
  });
  if ("blocked" in result) {
    return Response.json({ error: "Exercise is used by an In-progress Session" }, { status: 409 });
  }
  if ("missing" in result) {
    const latest = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
    });
    return latest
      ? versionConflict(latest, "Exercise changed on another device")
      : Response.json({ error: "Exercise not found" }, { status: 404 });
  }
  if (result.deleted === 0) {
    const latest = await prisma.exercise.findUniqueOrThrow({
      where: { id: exerciseId },
      select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
    });
    return versionConflict(latest, "Exercise changed on another device");
  }
  return new Response(null, { status: 204 });
}
