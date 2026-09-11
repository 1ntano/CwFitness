import { getVerifiedSession } from "@/lib/auth";
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
  if (!Number.isInteger(setCount) || Number(setCount) < 1 || !Number.isInteger(targetValue) || Number(targetValue) < 1) {
    return { error: "Invalid Planned Exercise targets" as const, status: 400 };
  }

  const planned = await prisma.plannedExercise.findFirst({
    where: {
      id: plannedExerciseId,
      workoutDayId: dayId,
      workoutDay: { workoutPlanId: planId, workoutPlan: { userId } },
    },
    select: { id: true, exercise: { select: { resistanceType: true } } },
  });
  if (!planned) return { error: "Planned Exercise not found" as const, status: 404 };

  let weightGrams: number | null = null;
  if (planned.exercise.resistanceType === "WEIGHTED") {
    weightGrams = weightInGrams(body?.weight, body?.weightUnit);
    if (weightGrams === null) {
      return { error: "Weighted Exercises require a positive kg or lb weight" as const, status: 400 };
    }
  } else if (body?.weight !== undefined || body?.weightUnit !== undefined) {
    return { error: "Bodyweight Exercises cannot prescribe external weight" as const, status: 400 };
  }

  return {
    plannedExerciseId,
    setCount: Number(setCount),
    targetValue: Number(targetValue),
    weightGrams,
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

  const plannedExercise = await prisma.plannedExercise.update({
    where: { id: plannedExerciseId },
    data: {
      setCount: targets.setCount,
      targetValue: targets.targetValue,
      weightGrams: targets.weightGrams,
    },
    select: { id: true, exerciseId: true, setCount: true, targetValue: true, weightGrams: true },
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
  const result = await prisma.plannedExercise.deleteMany({
    where: {
      id: plannedExerciseId,
      workoutDayId: dayId,
      workoutDay: { workoutPlanId: planId, workoutPlan: { userId: session.user.id } },
    },
  });
  if (result.count === 0) return Response.json({ error: "Planned Exercise not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
