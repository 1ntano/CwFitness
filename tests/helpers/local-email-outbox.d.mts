export type LocalEmail = {
  to: string;
  kind: "verification" | "password-reset";
  subject: string;
  url: string;
  token: string;
  sentAt: string;
};

export function localEmailOutboxPath(): string;
export function readLocalEmails(): Promise<LocalEmail[]>;
export function waitForLocalEmail(input: { to: string; kind: LocalEmail["kind"] }): Promise<LocalEmail>;
