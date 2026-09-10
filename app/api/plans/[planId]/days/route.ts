import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: RouteContext<"/api/plans/[planId]/days">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const suggestedWeekday = body?.suggestedWeekday ?? null;
  if (!name || name.length > 80 || (suggestedWeekday !== null && (!Number.isInteger(suggestedWeekday) || Number(suggestedWeekday) < 0 || Number(suggestedWeekday) > 6))) {
    return Response.json({ error: "Invalid Workout Day" }, { status: 400 });
  }

  const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId: session.user.id }, select: { id: true } });
  if (!plan) return Response.json({ error: "Workout Plan not found" }, { status: 404 });

  const workoutDay = await prisma.workoutDay.create({
    data: { name, suggestedWeekday: suggestedWeekday as number | null, workoutPlanId: plan.id },
    select: { id: true, name: true, suggestedWeekday: true },
  });
  return Response.json({ workoutDay }, { status: 201 });
}
