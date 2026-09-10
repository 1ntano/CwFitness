import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function validWeekday(value: unknown) {
  return value === null || (Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ planId: string; dayId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, dayId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const suggestedWeekday = body?.suggestedWeekday ?? null;
  if (!name || name.length > 80 || !validWeekday(suggestedWeekday)) {
    return Response.json({ error: "Invalid Workout Day" }, { status: 400 });
  }

  const result = await prisma.workoutDay.updateMany({
    where: {
      id: dayId,
      workoutPlanId: planId,
      workoutPlan: { userId: session.user.id },
    },
    data: { name, suggestedWeekday: suggestedWeekday as number | null },
  });
  if (result.count === 0) return Response.json({ error: "Workout Day not found" }, { status: 404 });
  return Response.json({ workoutDay: { id: dayId, name, suggestedWeekday } });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ planId: string; dayId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, dayId } = await context.params;
  const result = await prisma.workoutDay.deleteMany({
    where: {
      id: dayId,
      workoutPlanId: planId,
      workoutPlan: { userId: session.user.id },
    },
  });
  if (result.count === 0) return Response.json({ error: "Workout Day not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
