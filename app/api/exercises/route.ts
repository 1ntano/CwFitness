import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const resistanceTypes = ["WEIGHTED", "BODYWEIGHT"] as const;
const targetTypes = ["REPETITIONS", "DURATION"] as const;

export async function GET(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exercises = await prisma.exercise.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
  });
  return Response.json({ exercises });
}

export async function POST(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const resistanceType = body?.resistanceType;
  const targetType = body?.targetType;
  if (
    !name || name.length > 80 ||
    !resistanceTypes.includes(resistanceType as (typeof resistanceTypes)[number]) ||
    !targetTypes.includes(targetType as (typeof targetTypes)[number])
  ) {
    return Response.json({ error: "Invalid Exercise" }, { status: 400 });
  }

  const exercise = await prisma.exercise.create({
    data: {
      name,
      resistanceType: resistanceType as (typeof resistanceTypes)[number],
      targetType: targetType as (typeof targetTypes)[number],
      userId: session.user.id,
    },
    select: { id: true, name: true, resistanceType: true, targetType: true, version: true },
  });
  return Response.json({ exercise }, { status: 201 });
}
