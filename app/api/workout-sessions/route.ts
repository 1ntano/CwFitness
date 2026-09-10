import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workoutSessionSelect } from "@/lib/workout-sessions";

function localDate(now: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const workoutDayId = typeof body?.workoutDayId === "string" ? body.workoutDayId : "";
  const timeZone = typeof body?.timeZone === "string" ? body.timeZone : "";
  const now = new Date();
  const localStartDate = localDate(now, timeZone);
  if (!workoutDayId || !localStartDate) return Response.json({ error: "Invalid Workout Session" }, { status: 400 });

  const existing = await prisma.workoutSession.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] } }, select: { id: true },
  });
  if (existing) return Response.json({ error: "An In-progress Session already exists" }, { status: 409 });

  const day = await prisma.workoutDay.findFirst({
    where: { id: workoutDayId, workoutPlan: { userId: session.user.id } },
    include: { workoutPlan: true, plannedExercises: { orderBy: { createdAt: "asc" }, include: { exercise: true } } },
  });
  if (!day) return Response.json({ error: "Workout Day not found" }, { status: 404 });

  try {
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutPlanId: day.workoutPlanId,
        workoutDayId: day.id,
        workoutPlanName: day.workoutPlan.name,
        workoutDayName: day.name,
        timeZone,
        localStartDate,
        startedAt: now,
        exercises: { create: day.plannedExercises.map((planned) => ({
          exerciseId: planned.exerciseId,
          exerciseName: planned.exercise.name,
          resistanceType: planned.exercise.resistanceType,
          targetType: planned.exercise.targetType,
          setCount: planned.setCount,
          targetValue: planned.targetValue,
          weightGrams: planned.weightGrams,
        })) },
      },
      select: workoutSessionSelect,
    });
    return Response.json({ workoutSession }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return Response.json({ error: "An In-progress Session already exists" }, { status: 409 });
    }
    throw error;
  }
}
