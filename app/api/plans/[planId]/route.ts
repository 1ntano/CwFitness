import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ planId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const archived = typeof body?.archived === "boolean" ? body.archived : undefined;
  const version = body?.version;
  if (!Number.isInteger(version) || Number(version) < 1 || (name !== undefined && (!name || name.length > 80)) || (name === undefined && archived === undefined)) {
    return Response.json({ error: "Plan name must contain 1 to 80 characters" }, { status: 400 });
  }

  const current = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true, name: true, archivedAt: true, version: true },
  });
  if (!current) return Response.json({ error: "Workout Plan not found" }, { status: 404 });
  if (current.version !== version) {
    return Response.json({ error: "Workout Plan changed on another device", code: "VERSION_CONFLICT", current }, { status: 409 });
  }

  const result = await prisma.workoutPlan.updateMany({
    where: { id: planId, userId: session.user.id, version: Number(version) },
    data: {
      ...(name === undefined ? {} : { name }),
      ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
      version: { increment: 1 },
    },
  });
  if (result.count === 0) {
    const latest = await prisma.workoutPlan.findUniqueOrThrow({
      where: { id: planId },
      select: { id: true, name: true, archivedAt: true, version: true },
    });
    return Response.json({ error: "Workout Plan changed on another device", code: "VERSION_CONFLICT", current: latest }, { status: 409 });
  }

  const plan = await prisma.workoutPlan.findUniqueOrThrow({
    where: { id: planId },
    select: { id: true, name: true, archivedAt: true, version: true },
  });
  return Response.json({ plan });
}

export async function DELETE(request: Request, context: { params: Promise<{ planId: string }> }) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const version = body?.version;
  if (!Number.isInteger(version) || Number(version) < 1) {
    return Response.json({ error: "Invalid version" }, { status: 400 });
  }

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true, version: true },
  });
  if (!plan) return Response.json({ error: "Workout Plan not found" }, { status: 404 });
  if (plan.version !== version) {
    return Response.json({ error: "Workout Plan changed on another device", code: "VERSION_CONFLICT", current: plan }, { status: 409 });
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.workoutSession.deleteMany({
      where: { workoutPlanId: planId, userId: session.user.id },
    });
    return tx.workoutPlan.deleteMany({
      where: { id: planId, userId: session.user.id, version: Number(version) },
    });
  });
  if (deleted.count === 0) {
    return Response.json({ error: "Workout Plan changed on another device", code: "VERSION_CONFLICT" }, { status: 409 });
  }
  return new Response(null, { status: 204 });
}