export function requestedVersion(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null;
}

export function versionConflict(current: unknown, message = "Data changed on another device") {
  return Response.json({ error: message, code: "VERSION_CONFLICT", current }, { status: 409 });
}

export function sessionUnavailable(current: unknown, code: "SESSION_TAKEN_OVER" | "VERSION_CONFLICT", message: string) {
  return Response.json({ error: message, code, current }, { status: 409 });
}
