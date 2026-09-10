import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null;
  if (body?.confirmation !== "DELETE") return Response.json({ error: "Confirmation is required" }, { status: 400 });
  await prisma.user.delete({ where: { id: session.user.id } });
  return new Response(null, { status: 204 });
}
