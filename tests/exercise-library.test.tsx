import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExerciseLibrary } from "../app/exercise-library";

describe("ExerciseLibrary", () => {
  it("submits a manually created Exercise through its public callback", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <ExerciseLibrary
        exercises={[]}
        busy={false}
        weightUnit="kg"
        onCreate={onCreate}
        onCreatePresets={vi.fn().mockResolvedValue(undefined)}
        onSavePlan={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.type(screen.getByLabelText("动作名称"), "平板支撑");
    await user.selectOptions(screen.getByLabelText("训练部位"), "CORE");
    await user.selectOptions(screen.getByLabelText("负重方式"), "BODYWEIGHT");
    await user.selectOptions(screen.getByLabelText("记录指标"), "DURATION");
    await user.click(screen.getByRole("button", { name: "新建动作" }));

    expect(onCreate).toHaveBeenCalledWith({
      name: "平板支撑",
      resistanceType: "BODYWEIGHT",
      targetType: "DURATION",
      muscleGroup: "CORE",
    });
  });

  it("adds a recommended exercise through its public callback", async () => {
    const user = userEvent.setup();
    const onCreatePresets = vi.fn().mockResolvedValue(undefined);

    render(
      <ExerciseLibrary
        exercises={[]}
        busy={false}
        weightUnit="kg"
        onCreate={vi.fn().mockResolvedValue(undefined)}
        onCreatePresets={onCreatePresets}
        onSavePlan={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "添加" })[0]);
    expect(onCreatePresets).toHaveBeenCalledWith(["杠铃卧推"]);
  });
});