import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { prisma } from "@/lib/prisma";

const trustedOrigins = [process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3100", ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [])]
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  trustedOrigins,
});
