import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type LocalEmailKind = "verification" | "password-reset";

export type LocalEmail = {
  to: string;
  kind: LocalEmailKind;
  subject: string;
  url: string;
  token: string;
  sentAt: string;
};

function localEmailOutboxPath() {
  return process.env.LOCAL_EMAIL_OUTBOX ?? resolve(process.cwd(), ".local-mail", "outbox.jsonl");
}

async function sendLocalEmail(input: Omit<LocalEmail, "sentAt">) {
  const path = localEmailOutboxPath();
  const message: LocalEmail = { ...input, sentAt: new Date().toISOString() };
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(message)}\n`, "utf8");
}

export async function sendAccountEmail(input: Omit<LocalEmail, "sentAt">) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Account email delivery is not configured");
  }
  await sendLocalEmail(input);
}
