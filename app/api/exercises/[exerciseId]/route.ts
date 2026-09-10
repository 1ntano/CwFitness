import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
