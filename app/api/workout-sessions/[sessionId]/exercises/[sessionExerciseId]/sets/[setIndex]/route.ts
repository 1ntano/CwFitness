import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weightInGrams } from "@/lib/weights";

export async function PUT(request: Request, context: { params: Promise<{ sessionId: string; sessionExerciseId: string; setIndex: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId, sessionExerciseId, setIndex: rawIndex } = await context.params;
  const setIndex = Number(rawIndex);
  const exercise = await prisma.sessionExercise.findFirst({
    where: { id: sessionExerciseId, workoutSessionId: sessionId, removedAt: null, workoutSession: { userId: session.user.id } },
    include: { workoutSession: { select: { status: true } } },
  });
  if (!exercise) return Response.json({ error: "Session Exercise not found" }, { status: 404 });
  if (exercise.workoutSession.status !== "ACTIVE" && exercise.workoutSession.status !== "COMPLETED") return Response.json({ error: "Session is not editable" }, { status: 409 });
  if (!Number.isInteger(setIndex) || setIndex < 1 || setIndex > exercise.setCount) return Response.json({ error: "Invalid set index" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const operationId = typeof body?.operationId === "string" && body.operationId.length > 0 && body.operationId.length <= 100 ? body.operationId : null;
  if (body?.operationId !== undefined && !operationId) return Response.json({ error: "Invalid operation id" }, { status: 400 });
  if (operationId) {
    const prior = await prisma.sessionSetResult.findUnique({ where: { operationId }, select: { sessionExerciseId: true, setIndex: true, actualValue: true, actualWeightGrams: true, skipped: true } });
    if (prior) {
      if (prior.sessionExerciseId !== sessionExerciseId || prior.setIndex !== setIndex) return Response.json({ error: "Operation id was already used" }, { status: 409 });
      return Response.json({ setResult: { setIndex: prior.setIndex, actualValue: prior.actualValue, actualWeightGrams: prior.actualWeightGrams, skipped: prior.skipped } });
    }
  }
  const skipped = body?.skipped === true;
  let actualValue: number | null = null;
  let actualWeightGrams: number | null = null;
  if (!skipped) {
    if (!Number.isInteger(body?.actualValue) || Number(body?.actualValue) < 0) return Response.json({ error: "Invalid actual value" }, { status: 400 });
    actualValue = Number(body?.actualValue);
    if (exercise.resistanceType === "WEIGHTED") {
      actualWeightGrams = weightInGrams(body?.actualWeight, body?.weightUnit);
      if (actualWeightGrams === null) return Response.json({ error: "Actual weight is required" }, { status: 400 });
    }
  }
  const setResult = await prisma.sessionSetResult.upsert({
    where: { sessionExerciseId_setIndex: { sessionExerciseId, setIndex } },
    create: { sessionExerciseId, setIndex, actualValue, actualWeightGrams, skipped, operationId },
    update: { actualValue, actualWeightGrams, skipped },
    select: { setIndex: true, actualValue: true, actualWeightGrams: true, skipped: true },
  });
  return Response.json({ setResult });
}
