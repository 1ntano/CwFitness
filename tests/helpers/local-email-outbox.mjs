import { readFile } from "node:fs/promises";

export function localEmailOutboxPath() {
  const path = process.env.LOCAL_EMAIL_OUTBOX;
  if (!path) throw new Error("LOCAL_EMAIL_OUTBOX is required for email assertions");
  return path;
}

export async function readLocalEmails() {
  try {
    const content = await readFile(localEmailOutboxPath(), "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

export async function waitForLocalEmail({ to, kind }) {
  const deadline = Date.now() + 5_000;
  const normalizedTo = to.toLowerCase();
  while (Date.now() < deadline) {
    const messages = await readLocalEmails();
    const match = messages.findLast((message) => message.to === normalizedTo && message.kind === kind);
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`No ${kind} email was captured for ${to}`);
}
