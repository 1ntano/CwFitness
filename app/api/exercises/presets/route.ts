import { getVerifiedSession } from "@/lib/auth";
import { EXERCISE_PRESETS } from "@/lib/exercise-presets";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getVerifiedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { names?: unknown } | null;
  const requestedNames = Array.isArray(body?.names)
    ? body.names.filter((name): name is string => typeof name === "string")
    : EXERCISE_PRESETS.map((preset) => preset.name);
  const requested = new Set(requestedNames);
  const presets = EXERCISE_PRESETS.filter((preset) => requested.has(preset.name));

  if (presets.length === 0) {
    return Response.json({ created: 0 });
  }

  const names = presets.map((preset) => preset.name);
  const existing = await prisma.exercise.findMany({
    where: { userId: session.user.id, name: { in: names } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((exercise) => exercise.name));
  const toCreate = presets.filter((preset) => !existingNames.has(preset.name));

  if (toCreate.length > 0) {
    await prisma.exercise.createMany({
      data: toCreate.map((preset) => ({
        name: preset.name,
        resistanceType: preset.resistanceType,
        targetType: preset.targetType,
        muscleGroup: preset.muscleGroup,
        defaultTargetValue: preset.targetType === "REPETITIONS"
          ? preset.resistanceType === "BODYWEIGHT" ? 12 : 8
          : 30,
        defaultWeightGrams: null,
        userId: session.user.id,
      })),
    });
  }

  return Response.json({ created: toCreate.length }, { status: 201 });
}