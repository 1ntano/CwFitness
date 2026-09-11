"use client";

import { useState } from "react";
import { MUSCLE_GROUP_LABELS } from "../lib/exercise-taxonomy";
import { weightFromGrams } from "../lib/weights";
import type { Plan, PlannedExercise, WorkoutDay } from "./workout-types";

type SavedPlanViewProps = {
  plans: Plan[];
  selectedPlanId: string;
  busy: boolean;
  weightUnit: "kg" | "lb";
  onStartWorkout: (day: WorkoutDay) => Promise<void>;
  onDeletePlan: (plan: Plan) => Promise<void>;
  onSetArchived: (plan: Plan, archived: boolean) => Promise<void>;
  onUpdateDay: (plan: Plan, day: WorkoutDay, name: string, suggestedWeekday: number | null) => Promise<void>;
  onUpdateExercise: (
    plan: Plan,
    day: WorkoutDay,
    planned: PlannedExercise,
    input: { setCount: number; targetValue: number; weight?: number; weightUnit?: "kg" | "lb" },
  ) => Promise<void>;
};

const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function targetLabel(setCount: number, targetValue: number, targetType: "REPETITIONS" | "DURATION") {
  const target = targetType === "REPETITIONS" ? `${targetValue} 次` : `${targetValue} 秒`;
  return `${setCount} 组 × ${target}`;
}

function prescriptionLabel(targetValue: number, targetType: "REPETITIONS" | "DURATION", weightGrams: number | null, weightUnit: "kg" | "lb") {
  const target = targetType === "REPETITIONS" ? `${targetValue} 次` : `${targetValue} 秒`;
  return weightGrams === null ? target : `${target} · ${weightFromGrams(weightGrams, weightUnit).toFixed(1)} ${weightUnit}`;
}

export function SavedPlanView({ plans, selectedPlanId, busy, weightUnit, onStartWorkout, onDeletePlan, onSetArchived, onUpdateDay, onUpdateExercise }: SavedPlanViewProps) {
  const [showArchived, setShowArchived] = useState(true);
  const archivedPlanCount = plans.filter((plan) => plan.archivedAt !== null).length;
  const visiblePlans = showArchived ? plans : plans.filter((plan) => plan.archivedAt === null);

  return (
    <section className="workspace-section saved-plan-page" aria-labelledby="saved-plan-title">
      <header className="section-heading">
        <div>
          <p className="section-kicker">训练计划</p>
          <h1 id="saved-plan-title">已保存的动作计划。</h1>
        </div>
        <p>这里展示从动作页面保存的动作、默认次数、重量和训练目标。</p>
      </header>

      {archivedPlanCount > 0 && (
        <div className="saved-plan-toolbar">
          <span>{showArchived ? `当前显示 ${archivedPlanCount} 个归档计划` : `已隐藏 ${archivedPlanCount} 个归档计划`}</span>
          <button className="action-button quiet" type="button" aria-expanded={showArchived} onClick={() => setShowArchived((visible) => !visible)}>
            {showArchived ? "隐藏归档计划" : "显示归档计划"}
          </button>
        </div>
      )}

      {visiblePlans.length === 0 ? (
        <div className="saved-plan-empty">
          {archivedPlanCount > 0 ? (
            <>
              <p>归档计划已隐藏。</p>
              <span>点击上方“显示归档计划”即可查看。</span>
            </>
          ) : (
            <>
              <p>还没有保存的训练计划。</p>
              <span>进入“动作”页面，添加动作后点击“保存计划”。</span>
            </>
          )}
        </div>
      ) : (
        <div className="saved-plan-list">
          {visiblePlans.map((plan) => (
            <article className={`saved-plan-card${plan.id === selectedPlanId ? " is-selected" : ""}${plan.archivedAt !== null ? " is-archived" : ""}`} key={plan.id}>
              <header className="saved-plan-header">
                <div>
                  <p className="section-kicker saved-plan-kicker">训练计划</p>
                  {plan.archivedAt !== null && <span className="saved-plan-status">已归档</span>}
                </div>
                <div className="saved-plan-actions">
                  <span>{plan.workoutDays.length} 个训练日</span>
                  <button className="action-button quiet" type="button" disabled={busy} onClick={() => onSetArchived(plan, plan.archivedAt === null)}>
                    {plan.archivedAt === null ? "归档计划" : "恢复计划"}
                  </button>
                  <button className="action-button danger" type="button" disabled={busy} onClick={() => onDeletePlan(plan)}>
                    删除计划
                  </button>
                </div>
              </header>

              {plan.workoutDays.length === 0 ? (
                <p className="empty-state">这个计划还没有训练日。</p>
              ) : plan.workoutDays.map((day) => (
                <section className="saved-day-card" key={day.id}>
                  <header className="saved-day-header">
                    <div className="saved-day-title-block">
                      <form className="saved-day-name-form" onSubmit={async (event) => {
                        event.preventDefault();
                        const form = event.currentTarget;
                        const data = new FormData(form);
                        const weekday = String(data.get("suggestedWeekday"));
                        await onUpdateDay(plan, day, String(data.get("name")), weekday === "" ? null : Number(weekday));
                      }}>
                        <label>
                          <span className="saved-plan-name-small">{plan.name}</span>
                          <input name="name" aria-label="训练日" defaultValue={day.name} required maxLength={80} />
                        </label>
                        <label>
                          <span>日期</span>
                          <select name="suggestedWeekday" defaultValue={day.suggestedWeekday ?? ""}>
                            <option value="">不指定</option>
                            {weekdays.map((label, index) => <option value={index} key={label}>{label}</option>)}
                          </select>
                        </label>
                        <button className="action-button" type="submit" disabled={busy}>保存</button>
                      </form>
                    </div>
                    <button
                      className="action-button primary"
                      type="button"
                      disabled={busy || day.plannedExercises.length === 0 || plan.archivedAt !== null}
                      onClick={() => onStartWorkout(day)}
                    >
                      {plan.archivedAt === null ? "开始训练" : "计划已归档"}
                    </button>
                  </header>


                  {day.plannedExercises.length === 0 ? (
                    <p className="empty-state">还没有保存的动作。</p>
                  ) : (
                    <div className="saved-exercise-list">
                      {day.plannedExercises.map((planned) => (
                        <article className="saved-exercise-item" key={planned.id}>
                          <div className="saved-exercise-row">
                            <div className="saved-exercise-copy">
                              <div className="exercise-title-line">
                                <h4>{planned.exercise.name}</h4>
                                <span className="exercise-prescription">
                                  {prescriptionLabel(planned.targetValue, planned.exercise.targetType, planned.weightGrams, weightUnit)}
                                </span>
                              </div>
                              <p>{MUSCLE_GROUP_LABELS[planned.exercise.muscleGroup]} · {planned.exercise.resistanceType === "WEIGHTED" ? "负重" : "自重"}</p>
                            </div>
                            <div className="saved-exercise-actions">
                              <strong>{targetLabel(planned.setCount, planned.targetValue, planned.exercise.targetType)}</strong>
                              <details className="saved-exercise-editor">
                                <summary>修改组数 / 次数</summary>
                                <form onSubmit={async (event) => {
                                  event.preventDefault();
                                  const form = event.currentTarget;
                                  const data = new FormData(form);
                                  const weightValue = String(data.get("weight") ?? "");
                                  await onUpdateExercise(plan, day, planned, {
                                    setCount: Number(data.get("setCount")),
                                    targetValue: Number(data.get("targetValue")),
                                    ...(planned.exercise.resistanceType === "WEIGHTED" && weightValue
                                      ? { weight: Number(weightValue), weightUnit }
                                      : {}),
                                  });
                                  const details = form.closest("details");
                                  if (details instanceof HTMLDetailsElement) details.open = false;
                                }}>
                                  <label>
                                    <span>组数</span>
                                    <input name="setCount" type="number" min={1} max={99} defaultValue={planned.setCount} required />
                                  </label>
                                  <label>
                                    <span>{planned.exercise.targetType === "REPETITIONS" ? "次数" : "秒数"}</span>
                                    <input name="targetValue" type="number" min={1} max={9999} defaultValue={planned.targetValue} required />
                                  </label>
                                  {planned.exercise.resistanceType === "WEIGHTED" && (
                                    <label>
                                      <span>修改重量（{weightUnit}）</span>
                                      <input
                                        name="weight"
                                        type="number"
                                        min={0.1}
                                        step={0.1}
                                        defaultValue={planned.weightGrams === null ? "" : weightFromGrams(planned.weightGrams, weightUnit).toFixed(1)}
                                      />
                                    </label>
                                  )}
                                  <button className="action-button primary" type="submit" disabled={busy}>保存</button>
                                </form>
                              </details>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
