import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExerciseLibrary } from "../app/exercise-library";

describe("ExerciseLibrary", () => {
  it("submits a new Exercise through its public callback", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <ExerciseLibrary
        exercises={[]}
        busy={false}
        onCreate={onCreate}
        onRename={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.type(screen.getByLabelText("动作名称"), "平板支撑");
    await user.selectOptions(screen.getByLabelText("负重方式"), "BODYWEIGHT");
    await user.selectOptions(screen.getByLabelText("记录指标"), "DURATION");
    await user.click(screen.getByRole("button", { name: "新建动作" }));

    expect(onCreate).toHaveBeenCalledWith({
      name: "平板支撑",
      resistanceType: "BODYWEIGHT",
      targetType: "DURATION",
    });
  });
});
