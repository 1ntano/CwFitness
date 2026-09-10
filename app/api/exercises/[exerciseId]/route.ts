import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: RouteContext<"/api/exercises/[exerciseId]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId } = await context.params;
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      resistanceType: true,
      targetType: true,
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
      plannedExerciseCount: exercise._count.plannedExercises,
      sessionExerciseCount: exercise._count.sessionExercises,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext<"/api/exercises/[exerciseId]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) {
    return Response.json({ error: "Exercise name must contain 1 to 80 characters" }, { status: 400 });
  }

  const existing = await prisma.exercise.findFirst({ where: { id: exerciseId, userId: session.user.id } });
  if (!existing) return Response.json({ error: "Exercise not found" }, { status: 404 });

  const exercise = await prisma.exercise.update({
    where: { id: exerciseId },
    data: { name },
    select: { id: true, name: true, resistanceType: true, targetType: true },
  });
  return Response.json({ exercise });
}

export async function DELETE(request: Request, context: RouteContext<"/api/exercises/[exerciseId]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.confirmation !== "DELETE") {
    return Response.json({ error: "Deletion confirmation is required" }, { status: 400 });
  }

  const inProgress = await prisma.sessionExercise.findFirst({
    where: {
      exerciseId,
      workoutSession: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
    },
    select: { id: true },
  });
  if (inProgress) {
    return Response.json({ error: "Exercise is used by an In-progress Session" }, { status: 409 });
  }

  const result = await prisma.exercise.deleteMany({
    where: { id: exerciseId, userId: session.user.id },
  });
  if (result.count === 0) return Response.json({ error: "Exercise not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
