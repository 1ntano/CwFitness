import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function notHandled() {
  return new Response(null, { status: 404 });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.DEV_LOGIN_ENABLED !== "true") return notHandled();

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const fixedEmail = process.env.DEV_LOGIN_EMAIL?.trim().toLowerCase();
  const fixedPassword = process.env.DEV_LOGIN_PASSWORD ?? "";

  if (!fixedEmail || !fixedPassword || email !== fixedEmail || password !== fixedPassword) {
    return notHandled();
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: fixedEmail } });

    if (!existing) {
      await auth.api.signUpEmail({
        body: {
          name: process.env.DEV_LOGIN_NAME ?? "演示用户",
          email: fixedEmail,
          password: fixedPassword,
        },
      });
    }

    await prisma.user.update({
      where: { email: fixedEmail },
      data: { emailVerified: true },
    });

    return auth.api.signInEmail({
      body: { email: fixedEmail, password: fixedPassword, rememberMe: true },
      headers: request.headers,
      asResponse: true,
    });
  } catch (error) {
    console.error("Development login failed", error);
    return Response.json({ message: "固定账号登录失败，请查看开发服务器日志。" }, { status: 500 });
  }
}