import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_NAME_PREFIX = "计划动作";
const DAY_NAME = "训练日";

export async function POST(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exercises = await prisma.exercise.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, defaultTargetValue: true, defaultWeightGrams: true },
  });

  if (exercises.length === 0) {
    return Response.json({ error: "动作库为空，请先添加动作。" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingPlans = await tx.workoutPlan.findMany({
      where: { userId: session.user.id, name: { startsWith: PLAN_NAME_PREFIX } },
      select: { name: true },
    });

    const maxIndex = existingPlans.reduce((max, plan) => {
      const match = new RegExp(`^${PLAN_NAME_PREFIX}(\\d+)$`).exec(plan.name);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    const plan = await tx.workoutPlan.create({
      data: {
        userId: session.user.id,
        name: `${PLAN_NAME_PREFIX}${maxIndex + 1}`,
        workoutDays: { create: { name: DAY_NAME } },
      },
      select: {
        id: true,
        name: true,
        workoutDays: { select: { id: true }, take: 1 },
      },
    });

    const day = plan.workoutDays[0];
    if (!day) throw new Error("Workout Day was not created");

    await tx.plannedExercise.createMany({
      data: exercises.map((exercise) => ({
        workoutDayId: day.id,
        exerciseId: exercise.id,
        setCount: 3,
        targetValue: exercise.defaultTargetValue,
        weightGrams: exercise.defaultWeightGrams,
      })),
      skipDuplicates: true,
    });

    return { plan: { id: plan.id, name: plan.name }, added: exercises.length, total: exercises.length };
  });

  return Response.json(result, { status: 201 });
}