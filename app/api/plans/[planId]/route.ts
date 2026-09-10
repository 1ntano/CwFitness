import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ planId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) {
    return Response.json({ error: "Plan name must contain 1 to 80 characters" }, { status: 400 });
  }

  const result = await prisma.workoutPlan.updateMany({
    where: { id: planId, userId: session.user.id },
    data: { name },
  });
  if (result.count === 0) return Response.json({ error: "Workout Plan not found" }, { status: 404 });
  return Response.json({ plan: { id: planId, name } });
}
