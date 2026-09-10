import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreExercises } from "@/lib/workout-sessions";

export async function GET(request: Request, context: { params: Promise<{ planId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { planId } = await context.params;
  const exercises = await prisma.sessionExercise.findMany({
    where: { source: "PLANNED", removedAt: null, workoutSession: { userId: session.user.id, workoutPlanId: planId, status: "COMPLETED" } },
    orderBy: { workoutSession: { completedAt: "desc" } },
    include: { exercise: { select: { name: true } }, setResults: true, workoutSession: { select: { localStartDate: true } } },
  });
  const groups = new Map<string, typeof exercises>();
  for (const exercise of exercises) {
    const key = [exercise.exerciseId, exercise.setCount, exercise.targetValue, exercise.weightGrams].join(":");
    groups.set(key, [...(groups.get(key) ?? []), exercise]);
  }
  return Response.json({ progress: [...groups.entries()].map(([key, items]) => {
    const recent = items.slice(0, 3).map((exercise) => ({ date: exercise.workoutSession.localStartDate, ...scoreExercises([exercise])[0] }));
    return { key, exerciseId: items[0].exerciseId, recent, progressionSuggestion: recent.length === 3 && recent.every((item) => item.achievementRate === 100) && recent.filter((item) => item.excessTargetValue > 0 || item.excessWeightGrams > 0).length >= 2 };
  }) });
}
