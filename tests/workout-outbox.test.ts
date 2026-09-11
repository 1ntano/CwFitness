import { describe, expect, it } from "vitest";

import { enqueueSet, queuedSets, removeQueuedSet } from "../app/workout-outbox";

describe("workout outbox", () => {
  it("keeps a set available until the caller explicitly removes it", async () => {
    const item = {
      id: "outbox-test-operation",
      path: "/api/workout-sessions/session/exercises/exercise/sets/1",
      body: JSON.stringify({ actualValue: 8, operationId: "outbox-test-operation" }),
    };

    await removeQueuedSet(item.id);
    await enqueueSet(item);

    expect(await queuedSets()).toContainEqual(item);

    await removeQueuedSet(item.id);

    expect(await queuedSets()).not.toContainEqual(item);
  });
});
