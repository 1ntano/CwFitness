import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { timeZone: true, weightUnit: true } });
  return Response.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { timeZone?: unknown; weightUnit?: unknown } | null;
  const timeZone = typeof body?.timeZone === "string" ? body.timeZone : "";
  const weightUnit = body?.weightUnit === "kg" || body?.weightUnit === "lb" ? body.weightUnit : null;
  try { Intl.DateTimeFormat(undefined, { timeZone }); } catch { return Response.json({ error: "Invalid time zone" }, { status: 400 }); }
  if (!weightUnit) return Response.json({ error: "Invalid weight unit" }, { status: 400 });
  const settings = await prisma.user.update({ where: { id: session.user.id }, data: { timeZone, weightUnit }, select: { timeZone: true, weightUnit: true } });
  return Response.json({ settings });
}
