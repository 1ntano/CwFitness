import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";
import { weightInGrams } from "@/lib/weights";

async function plannedExerciseTargets(
  userId: string,
  planId: string,
  dayId: string,
  plannedExerciseId: string,
  body: Record<string, unknown> | null,
) {
  const setCount = body?.setCount;
  const targetValue = body?.targetValue;
  const version = requestedVersion(body?.version);
  if (!version || !Number.isInteger(setCount) || Number(setCount) < 1 || !Number.isInteger(targetValue) || Number(targetValue) < 1) {
    return { error: "Invalid Planned Exercise targets" as const, status: 400 };
  }

  const planned = await prisma.plannedExercise.findFirst({
    where: {
      id: plannedExerciseId,
      workoutDayId: dayId,
      workoutDay: { workoutPlanId: planId, workoutPlan: { userId } },
    },
    select: { id: true, setCount: true, targetValue: true, weightGrams: true, version: true, exercise: { select: { resistanceType: true } } },
  });
  if (!planned) return { error: "Planned Exercise not found" as const, status: 404 };
  if (planned.version !== version) return { conflict: planned, message: "Planned Exercise changed on another device" as const };

  let weightGrams: number | null = null;
  if (planned.exercise.resistanceType === "WEIGHTED") {
    if (body?.weight !== undefined || body?.weightUnit !== undefined) {
      weightGrams = weightInGrams(body?.weight, body?.weightUnit);
      if (weightGrams === null) {
        return { error: "Weighted Exercises require a positive kg or lb weight" as const, status: 400 };
      }
    } else {
      weightGrams = planned.weightGrams;
    }
  } else if (body?.weight !== undefined || body?.weightUnit !== undefined) {
    return { error: "Bodyweight Exercises cannot prescribe external weight" as const, status: 400 };
  }

  return {
    plannedExerciseId,
    setCount: Number(setCount),
    targetValue: Number(targetValue),
    weightGrams,
    version,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ planId: string; dayId: string; plannedExerciseId: string }> },
) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, dayId, plannedExerciseId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const targets = await plannedExerciseTargets(
    session.user.id,
    planId,
    dayId,
    plannedExerciseId,
    body,
  );
  if ("error" in targets) {
    return Response.json({ error: targets.error }, { status: targets.status ?? 400 });
  }
  if ("conflict" in targets) return versionConflict(targets.conflict, targets.message);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.plannedExercise.updateMany({
      where: { id: plannedExerciseId, workoutDayId: dayId, version: targets.version },
      data: { setCount: targets.setCount, targetValue: targets.targetValue, weightGrams: targets.weightGrams, version: { increment: 1 } },
    });
    if (updated.count === 0) return 0;
    const lockedDay = await tx.workoutDay.updateMany({
      where: {
        id: dayId,
        workoutPlanId: planId,
        workoutPlan: { userId: session.user.id },
      },
      data: { version: { increment: 1 } },
    });
    if (lockedDay.count === 0) return 0;
    return updated.count;
  });
  if (result === 0) {
    const current = await prisma.plannedExercise.findUniqueOrThrow({
      where: { id: plannedExerciseId },
      select: { id: true, exerciseId: true, setCount: true, targetValue: true, weightGrams: true, version: true },
    });
    return versionConflict(current, "Planned Exercise changed on another device");
  }
  const plannedExercise = await prisma.plannedExercise.findUniqueOrThrow({
    where: { id: plannedExerciseId },
    select: { id: true, exerciseId: true, setCount: true, targetValue: true, weightGrams: true, version: true },
  });
  return Response.json({ plannedExercise });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ planId: string; dayId: string; plannedExerciseId: string }> },
) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, dayId, plannedExerciseId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });

  const current = await prisma.plannedExercise.findFirst({
    where: {
      id: plannedExerciseId,
      workoutDayId: dayId,
      workoutDay: { workoutPlanId: planId, workoutPlan: { userId: session.user.id } },
    },
    select: {
      id: true,
      exerciseId: true,
      setCount: true,
      targetValue: true,
      weightGrams: true,
      version: true,
      workoutDay: { select: { id: true, name: true, suggestedWeekday: true, version: true } },
    },
  });
  if (!current) return Response.json({ error: "Planned Exercise not found" }, { status: 404 });
  if (current.version !== version) return versionConflict(current, "Planned Exercise changed on another device");

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.plannedExercise.deleteMany({ where: { id: plannedExerciseId, workoutDayId: dayId, version } });
    if (deleted.count === 0) return 0;
    const lockedDay = await tx.workoutDay.updateMany({
      where: { id: dayId, workoutPlanId: planId, workoutPlan: { userId: session.user.id } },
      data: { version: { increment: 1 } },
    });
    if (lockedDay.count === 0) return 0;
    return deleted.count;
  });
  if (!result) {
    const latest = await prisma.plannedExercise.findFirst({
      where: { id: plannedExerciseId, workoutDayId: dayId },
      select: {
        id: true,
        exerciseId: true,
        setCount: true,
        targetValue: true,
        weightGrams: true,
        version: true,
        workoutDay: { select: { id: true, name: true, suggestedWeekday: true, version: true } },
      },
    });
    return latest
      ? versionConflict(latest, "Planned Exercise changed on another device")
      : Response.json({ error: "Planned Exercise not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
