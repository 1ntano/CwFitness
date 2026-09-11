import { getVerifiedSession } from "@/lib/auth";
import { requestedVersion, versionConflict } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";

function validWeekday(value: unknown) {
  return value === null || (Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ planId: string; dayId: string }> },
) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, dayId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const suggestedWeekday = body?.suggestedWeekday ?? null;
  const version = requestedVersion(body?.version);
  if (!version || !name || name.length > 80 || !validWeekday(suggestedWeekday)) {
    return Response.json({ error: "Invalid Workout Day" }, { status: 400 });
  }

  const current = await prisma.workoutDay.findFirst({
    where: { id: dayId, workoutPlanId: planId, workoutPlan: { userId: session.user.id } },
    select: { id: true, name: true, suggestedWeekday: true, version: true },
  });
  if (!current) return Response.json({ error: "Workout Day not found" }, { status: 404 });
  if (current.version !== version) return versionConflict(current, "Workout Day changed on another device");

  const result = await prisma.workoutDay.updateMany({
    where: {
      id: dayId,
      workoutPlanId: planId,
      workoutPlan: { userId: session.user.id },
      version,
    },
    data: { name, suggestedWeekday: suggestedWeekday as number | null, version: { increment: 1 } },
  });
  if (result.count === 0) {
    const latest = await prisma.workoutDay.findUniqueOrThrow({
      where: { id: dayId },
      select: { id: true, name: true, suggestedWeekday: true, version: true },
    });
    return versionConflict(latest, "Workout Day changed on another device");
  }
  return Response.json({ workoutDay: { id: dayId, name, suggestedWeekday, version: version + 1 } });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ planId: string; dayId: string }> },
) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, dayId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = requestedVersion(body?.version);
  if (!version) return Response.json({ error: "Version is required" }, { status: 400 });

  const current = await prisma.workoutDay.findFirst({
    where: {
      id: dayId,
      workoutPlanId: planId,
      workoutPlan: { userId: session.user.id },
    },
    select: { id: true, name: true, suggestedWeekday: true, version: true },
  });
  if (!current) return Response.json({ error: "Workout Day not found" }, { status: 404 });
  if (current.version !== version) return versionConflict(current, "Workout Day changed on another device");

  const deleted = await prisma.$transaction(async (tx) => {
    const result = await tx.workoutDay.deleteMany({ where: { id: dayId, workoutPlanId: planId, version } });
    if (result.count === 0) return false;
    const lockedPlan = await tx.workoutPlan.updateMany({
      where: { id: planId, userId: session.user.id },
      data: { version: { increment: 1 } },
    });
    if (lockedPlan.count === 0) return false;
    return true;
  });
  if (!deleted) {
    const latest = await prisma.workoutDay.findFirst({
      where: { id: dayId, workoutPlanId: planId, workoutPlan: { userId: session.user.id } },
      select: { id: true, name: true, suggestedWeekday: true, version: true },
    });
    return latest
      ? versionConflict(latest, "Workout Day changed on another device")
      : Response.json({ error: "Workout Day not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
