import { getVerifiedSession } from "@/lib/auth";
import { MUSCLE_GROUPS } from "@/lib/exercise-taxonomy";
import { prisma } from "@/lib/prisma";

const resistanceTypes = ["WEIGHTED", "BODYWEIGHT"] as const;
const targetTypes = ["REPETITIONS", "DURATION"] as const;

export async function GET(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exercises = await prisma.exercise.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, resistanceType: true, targetType: true, muscleGroup: true, defaultTargetValue: true, defaultWeightGrams: true, version: true },
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
  const muscleGroup = body?.muscleGroup;
  const defaultTargetValue = body?.defaultTargetValue === undefined
    ? targetType === "DURATION" ? 30 : resistanceType === "BODYWEIGHT" ? 12 : 8
    : Number(body.defaultTargetValue);
  const defaultWeightGrams = body?.defaultWeightGrams === undefined || body.defaultWeightGrams === null
    ? null
    : Number(body.defaultWeightGrams);

  if (
    !name || name.length > 80 ||
    !resistanceTypes.includes(resistanceType as (typeof resistanceTypes)[number]) ||
    !targetTypes.includes(targetType as (typeof targetTypes)[number]) ||
    !MUSCLE_GROUPS.includes(muscleGroup as (typeof MUSCLE_GROUPS)[number]) ||
    !Number.isInteger(defaultTargetValue) || defaultTargetValue < 1 || defaultTargetValue > 9999 ||
    (defaultWeightGrams !== null && (!Number.isInteger(defaultWeightGrams) || defaultWeightGrams < 1 || defaultWeightGrams > 1_000_000))
  ) {
    return Response.json({ error: "Invalid Exercise" }, { status: 400 });
  }

  const exercise = await prisma.exercise.create({
    data: {
      name,
      resistanceType: resistanceType as (typeof resistanceTypes)[number],
      targetType: targetType as (typeof targetTypes)[number],
      muscleGroup: muscleGroup as (typeof MUSCLE_GROUPS)[number],
      defaultTargetValue,
      defaultWeightGrams,
      userId: session.user.id,
    },
    select: { id: true, name: true, resistanceType: true, targetType: true, muscleGroup: true, defaultTargetValue: true, defaultWeightGrams: true, version: true },
  });
  return Response.json({ exercise }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.confirmation !== "DELETE_ALL") {
    return Response.json({ error: "删除确认无效。" }, { status: 400 });
  }

  const inProgress = await prisma.sessionExercise.findFirst({
    where: {
      exercise: { userId: session.user.id },
      workoutSession: { userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] } },
    },
    select: { id: true },
  });
  if (inProgress) return Response.json({ error: "训练进行中，不能删除全部动作。" }, { status: 409 });

  const deleted = await prisma.exercise.deleteMany({ where: { userId: session.user.id } });
  return Response.json({ deleted: deleted.count });
}
