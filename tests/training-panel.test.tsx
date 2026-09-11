import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TrainingPanel } from "../app/training-panel";
import type { WorkoutSession } from "../app/workout-types";

const session: WorkoutSession = {
  id: "session-1",
  status: "ACTIVE",
  timeZone: "UTC",
  localStartDate: "2026-09-11",
  startedAt: "2026-09-11T00:00:00.000Z",
  pausedAt: null,
  completedAt: null,
  modifiedAt: null,
  trainingTimeSeconds: null,
  version: 1,
  editingDeviceId: "device-1",
  exercises: [{
    id: "session-exercise-1",
    exerciseId: "exercise-1",
    exerciseName: "杠铃卧推",
    resistanceType: "WEIGHTED",
    targetType: "REPETITIONS",
    setCount: 1,
    targetValue: 8,
    weightGrams: 40000,
    position: 0,
    source: "PLANNED",
    removedAt: null,
    setResults: [],
  }],
};

function renderTrainingPanel() {
  const onRecordSet = vi.fn().mockResolvedValue(undefined);
  render(
    <TrainingPanel
      session={session}
      exercises={[]}
      busy={false}
      weightUnit="kg"
      canEdit
      offline={false}
      onRecordSet={onRecordSet}
      onAddExercise={vi.fn().mockResolvedValue(undefined)}
      onRemoveExercise={vi.fn().mockResolvedValue(undefined)}
      onPause={vi.fn().mockResolvedValue(undefined)}
      onResume={vi.fn().mockResolvedValue(undefined)}
      onComplete={vi.fn().mockResolvedValue(undefined)}
      onAbandon={vi.fn().mockResolvedValue(undefined)}
      onTakeover={vi.fn().mockResolvedValue(undefined)}
      onReorder={vi.fn().mockResolvedValue(undefined)}
    />,
  );
  return { onRecordSet };
}

describe("TrainingPanel rest timer", () => {
  it("starts automatically after recording a set and can add time", async () => {
    const user = userEvent.setup();
    const { onRecordSet } = renderTrainingPanel();

    await user.click(screen.getByRole("button", { name: "记录完成" }));

    const timer = await screen.findByRole("timer");
    expect(onRecordSet).toHaveBeenCalledOnce();
    expect(timer.textContent).toContain("01:30");
    expect(screen.queryByText(/杠铃卧推 · 第 1 组已完成/)).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "+15 秒" }));
    expect(timer.textContent).toContain("01:45");
  });
});
