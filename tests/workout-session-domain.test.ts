import { describe, expect, it } from "vitest";

import { confirmedActiveDurationMs } from "../lib/workout-session-domain";

describe("confirmedActiveDurationMs", () => {
  it("counts elapsed time only up to the stale heartbeat limit", () => {
    const lastHeartbeatAt = new Date("2026-09-10T14:00:00.000Z");

    expect(confirmedActiveDurationMs(lastHeartbeatAt, new Date("2026-09-10T14:04:00.000Z"))).toBe(240_000);
    expect(confirmedActiveDurationMs(lastHeartbeatAt, new Date("2026-09-10T14:07:00.000Z"))).toBe(300_000);
  });
});
