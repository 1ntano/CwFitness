"use client";

import { FormEvent, useState } from "react";
import { EXERCISE_PRESETS } from "../lib/exercise-presets";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, type MuscleGroup } from "../lib/exercise-taxonomy";
import { weightFromGrams, weightInGrams } from "../lib/weights";
import type { Exercise, ResistanceType, TargetType } from "./workout-types";

export type NewExerciseInput = {
  name: string;
  resistanceType: ResistanceType;
  targetType: TargetType;
  muscleGroup: MuscleGroup;
};

type ExerciseLibraryProps = {
  exercises: Exercise[];
  busy: boolean;
  weightUnit: "kg" | "lb";
  onCreate: (input: NewExerciseInput) => Promise<void>;
  onCreatePresets: (names: string[]) => Promise<void>;
  onSavePlan: () => Promise<void>;
  onUpdate: (exercise: Exercise, name: string, defaultTargetValue: number, defaultWeightGrams: number | null) => Promise<void>;
  onDelete: (exercise: Exercise) => Promise<void>;
  onDeleteAll: () => Promise<void>;
};

function typeLabel(exercise: Pick<Exercise, "resistanceType" | "targetType">) {
  const resistance = exercise.resistanceType === "WEIGHTED" ? "负重" : "自重";
  const target = exercise.targetType === "REPETITIONS" ? "次数" : "时长";
  return `${target} · ${resistance}`;
}

function prescriptionLabel(exercise: Exercise, weightUnit: "kg" | "lb") {
  const target = exercise.targetType === "REPETITIONS"
    ? `${exercise.defaultTargetValue} 次`
    : `${exercise.defaultTargetValue} 秒`;
  if (exercise.resistanceType !== "WEIGHTED") return target;
  const weight = exercise.defaultWeightGrams === null
    ? "未设重量"
    : `${weightFromGrams(exercise.defaultWeightGrams, weightUnit).toFixed(1)} ${weightUnit}`;
  return `${target} · ${weight}`;
}

export function ExerciseLibrary({ exercises, busy, weightUnit, onCreate, onCreatePresets, onSavePlan, onUpdate, onDelete, onDeleteAll }: ExerciseLibraryProps) {
  const [presetPageIndex, setPresetPageIndex] = useState(0);
  const existingNames = new Set(exercises.map((exercise) => exercise.name));
  const missingPresetNames = EXERCISE_PRESETS
    .filter((preset) => !existingNames.has(preset.name))
    .map((preset) => preset.name);
  const presetPages = MUSCLE_GROUPS
    .map((muscleGroup) => ({ muscleGroup, items: EXERCISE_PRESETS.filter((preset) => preset.muscleGroup === muscleGroup) }))
    .filter((page) => page.items.length > 0);
  const currentPresetPage = presetPages[Math.min(presetPageIndex, presetPages.length - 1)];
  const currentMissingPresetNames = currentPresetPage
    ? currentPresetPage.items.filter((preset) => !existingNames.has(preset.name)).map((preset) => preset.name)
    : [];
  const exerciseGroups = MUSCLE_GROUPS
    .map((muscleGroup) => ({ muscleGroup, items: exercises.filter((exercise) => exercise.muscleGroup === muscleGroup) }))
    .filter((group) => group.items.length > 0);

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await onCreate({
      name: String(data.get("name")),
      resistanceType: String(data.get("resistanceType")) as ResistanceType,
      targetType: String(data.get("targetType")) as TargetType,
      muscleGroup: String(data.get("muscleGroup")) as MuscleGroup,
    });
  }

  return (
    <>
      <section className="workspace-section" aria-labelledby="exercise-title">
      <header className="section-heading">
        <div>
          <p className="section-kicker">动作库</p>
          <h1 id="exercise-title">按训练部位组织你的动作。</h1>
        </div>
        <p>动作保留稳定身份、记录类型和训练部位，目标值属于每个训练日。</p>
      </header>

      <section className="preset-panel" aria-label="推荐动作">
        <header className="preset-header">
          <div>
            <p className="section-kicker">推荐动作</p>
            <p>按页切换训练部位，可添加当前页全部动作，也可以单个挑选。</p>
          </div>
          <button
            className="action-button quiet"
            type="button"
            disabled={busy || missingPresetNames.length === 0}
            onClick={() => onCreatePresets(missingPresetNames)}
          >
            {missingPresetNames.length === 0 ? "推荐动作已全部添加" : `添加全部推荐 · ${missingPresetNames.length}`}
          </button>
        </header>

        {currentPresetPage && (
          <div className="preset-pager">
            <nav className="preset-tabs" aria-label="推荐动作训练部位">
              {presetPages.map((page, index) => (
                <button
                  type="button"
                  className={`preset-tab${index === presetPageIndex ? " is-current" : ""}`}
                  aria-current={index === presetPageIndex ? "page" : undefined}
                  key={page.muscleGroup}
                  onClick={() => setPresetPageIndex(index)}
                >
                  <span>{MUSCLE_GROUP_LABELS[page.muscleGroup]}</span>
                  <small>{page.items.length}</small>
                </button>
              ))}
            </nav>

            <header className="preset-page-header">
              <div>
                <p className="section-kicker">第 {presetPageIndex + 1} / {presetPages.length} 页</p>
                <h3>{MUSCLE_GROUP_LABELS[currentPresetPage.muscleGroup]}</h3>
              </div>
              <div className="preset-page-actions">
                <button
                  className="action-button"
                  type="button"
                  disabled={presetPageIndex === 0}
                  onClick={() => setPresetPageIndex((index) => Math.max(0, index - 1))}
                >
                  上一页
                </button>
                <button
                  className="action-button primary"
                  type="button"
                  disabled={busy || currentMissingPresetNames.length === 0}
                  onClick={() => onCreatePresets(currentMissingPresetNames)}
                >
                  {currentMissingPresetNames.length === 0 ? "本页已添加" : `添加本页全部 · ${currentMissingPresetNames.length}`}
                </button>
                <button
                  className="action-button"
                  type="button"
                  disabled={presetPageIndex === presetPages.length - 1}
                  onClick={() => setPresetPageIndex((index) => Math.min(presetPages.length - 1, index + 1))}
                >
                  下一页
                </button>
              </div>
            </header>

            <div className="preset-grid preset-page-grid">
              {currentPresetPage.items.map((preset) => {
                const added = existingNames.has(preset.name);
                return (
                  <article className={`preset-card${added ? " is-added" : ""}`} key={preset.name}>
                    <div className="preset-copy">
                      <strong>{preset.name}</strong>
                      <span>{typeLabel(preset)}</span>
                    </div>
                    <button
                      className="action-button"
                      type="button"
                      disabled={busy || added}
                      onClick={() => onCreatePresets([preset.name])}
                    >
                      {added ? "已添加" : "添加"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>


      <form className="toolbar-form exercise-create-form" onSubmit={submitNew}>
        <label>
          <span>动作名称</span>
          <input name="name" placeholder="例如：杠铃深蹲" required maxLength={80} />
        </label>
        <label>
          <span>训练部位</span>
          <select name="muscleGroup" defaultValue="LEGS">
            {MUSCLE_GROUPS.map((group) => <option value={group} key={group}>{MUSCLE_GROUP_LABELS[group]}</option>)}
          </select>
        </label>
        <label>
          <span>负重方式</span>
          <select name="resistanceType" defaultValue="WEIGHTED">
            <option value="WEIGHTED">负重</option>
            <option value="BODYWEIGHT">自重</option>
          </select>
        </label>
        <label>
          <span>记录指标</span>
          <select name="targetType" defaultValue="REPETITIONS">
            <option value="REPETITIONS">次数</option>
            <option value="DURATION">秒数</option>
          </select>
        </label>
        <button className="action-button primary" type="submit" disabled={busy}>新建动作</button>
      </form>

      <div className="exercise-groups" data-testid="exercise-list">
        {exerciseGroups.length === 0 ? (
          <p className="empty-state">动作库还是空的。先添加推荐动作，或创建自己的动作。</p>
        ) : exerciseGroups.map(({ muscleGroup, items }) => (
          <section className="exercise-group" key={muscleGroup}>
            <header>
              <span>{MUSCLE_GROUP_LABELS[muscleGroup]}</span>
              <small>{items.length} 个动作</small>
            </header>
            <div className="exercise-list">
              {items.map((exercise) => (
                <article className="exercise-row" key={exercise.id}>
                  <div className="row-copy">
                    <div className="exercise-title-line">
                      <h2>{exercise.name}</h2>
                      <span className="exercise-prescription">{prescriptionLabel(exercise, weightUnit)}</span>
                    </div>
                    <p>{typeLabel(exercise)}</p>
                  </div>
                  <div className="row-actions">
                    <details className="inline-editor">
                      <summary>编辑动作</summary>
                      <form onSubmit={async (event) => {
                        event.preventDefault();
                        const form = event.currentTarget;
                        const data = new FormData(form);
                        const weightValue = String(data.get("defaultWeightGrams") ?? "");
                        const defaultWeightGrams = exercise.resistanceType === "WEIGHTED" && weightValue
                          ? weightInGrams(Number(weightValue), weightUnit)
                          : null;
                        await onUpdate(exercise, String(data.get("name")), Number(data.get("defaultTargetValue")), defaultWeightGrams);
                        const details = form.closest("details");
                        if (details instanceof HTMLDetailsElement) details.open = false;
                      }}>
                        <label>
                          <span>动作名称</span>
                          <input name="name" defaultValue={exercise.name} required maxLength={80} />
                        </label>
                        <label>
                          <span>{exercise.targetType === "REPETITIONS" ? "修改次数" : "修改秒数"}</span>
                          <input name="defaultTargetValue" type="number" min={1} max={9999} defaultValue={exercise.defaultTargetValue} required />
                        </label>
                        {exercise.resistanceType === "WEIGHTED" && (
                          <label>
                            <span>修改重量（{weightUnit}）</span>
                            <input
                              name="defaultWeightGrams"
                              type="number"
                              min={0.1}
                              step={0.1}
                              defaultValue={exercise.defaultWeightGrams === null ? "" : weightFromGrams(exercise.defaultWeightGrams, weightUnit).toFixed(1)}
                            />
                          </label>
                        )}
                        <button className="action-button" type="submit" disabled={busy}>保存动作</button>
                      </form>
                    </details>
                    <button className="action-button danger" type="button" disabled={busy} onClick={() => onDelete(exercise)}>
                      永久删除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      </section>

      <div className="exercise-save-row">
        <button
          className="action-button danger delete-all-button"
          type="button"
          disabled={busy || exercises.length === 0}
          onClick={onDeleteAll}
        >
          全部删除
        </button>
        <button
          className="action-button primary save-plan-button"
          type="button"
          disabled={busy || exercises.length === 0}
          onClick={onSavePlan}
        >
          保存计划
        </button>
      </div>
    </>
  );
}
