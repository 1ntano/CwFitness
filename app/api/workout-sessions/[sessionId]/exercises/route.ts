import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weightInGrams } from "@/lib/weights";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const workoutSession = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId: session.user.id }, select: { status: true } });
  if (!workoutSession) return Response.json({ error: "Workout Session not found" }, { status: 404 });
  if (workoutSession.status !== "ACTIVE") return Response.json({ error: "Session is not active" }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const exerciseId = typeof body?.exerciseId === "string" ? body.exerciseId : "";
  const setCount = body?.setCount;
  const targetValue = body?.targetValue;
  if (!exerciseId || !Number.isInteger(setCount) || Number(setCount) < 1 || !Number.isInteger(targetValue) || Number(targetValue) < 1) return Response.json({ error: "Complete targets are required" }, { status: 400 });
  const exercise = await prisma.exercise.findFirst({ where: { id: exerciseId, userId: session.user.id } });
  if (!exercise) return Response.json({ error: "Exercise not found" }, { status: 404 });
  let weightGrams: number | null = null;
  if (exercise.resistanceType === "WEIGHTED") {
    weightGrams = weightInGrams(body?.weight, body?.weightUnit);
    if (weightGrams === null) return Response.json({ error: "Weight is required" }, { status: 400 });
  } else if (body?.weight !== undefined || body?.weightUnit !== undefined) return Response.json({ error: "Bodyweight Exercise cannot have weight" }, { status: 400 });
  const sessionExercise = await prisma.sessionExercise.create({
    data: { workoutSessionId: sessionId, exerciseId, exerciseName: exercise.name, resistanceType: exercise.resistanceType, targetType: exercise.targetType, setCount: Number(setCount), targetValue: Number(targetValue), weightGrams, source: "ADDED" },
    select: { id: true, exerciseId: true, exerciseName: true, resistanceType: true, targetType: true, setCount: true, targetValue: true, weightGrams: true, source: true },
  });
  return Response.json({ sessionExercise }, { status: 201 });
}
