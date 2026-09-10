import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workoutSessionSelect } from "@/lib/workout-sessions";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "PAUSED"] } },
    select: workoutSessionSelect,
  });
  return Response.json({ workoutSession });
}
