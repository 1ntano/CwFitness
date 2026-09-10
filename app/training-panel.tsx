"use client";

import { useState } from "react";
import type { Exercise, SessionExercise, SetResult, WorkoutSession } from "./workout-types";

type SetInput = {
  actualValue: number;
  actualWeight?: number;
};

type AddedExerciseInput = {
  exerciseId: string;
  setCount: number;
  targetValue: number;
  weight?: number;
};

type TrainingPanelProps = {
  session: WorkoutSession;
  exercises: Exercise[];
  busy: boolean;
  onRecordSet: (exercise: SessionExercise, setIndex: number, input: SetInput | null) => Promise<void>;
  onAddExercise: (input: AddedExerciseInput) => Promise<void>;
  onRemoveExercise: (exercise: SessionExercise) => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onComplete: () => Promise<void>;
};

function targetText(exercise: SessionExercise) {
  const metric = exercise.targetType === "REPETITIONS" ? `${exercise.targetValue} 次` : `${exercise.targetValue} 秒`;
  const weight = exercise.resistanceType === "WEIGHTED" && exercise.weightGrams !== null
    ? ` · ${(exercise.weightGrams / 1000).toFixed(1)} kg`
    : "";
  return metric + weight;
}

function resultText(exercise: SessionExercise, result: SetResult | undefined) {
  if (!result) return "未记录";
  if (result.skipped) return "已跳过";
  const metric = exercise.targetType === "REPETITIONS" ? `${result.actualValue ?? 0} 次` : `${result.actualValue ?? 0} 秒`;
  const weight = result.actualWeightGrams === null ? "" : ` · ${(result.actualWeightGrams / 1000).toFixed(1)} kg`;
  return metric + weight;
}

export function TrainingPanel({ session, exercises: availableExercises, busy, onRecordSet, onAddExercise, onRemoveExercise, onPause, onResume, onComplete }: TrainingPanelProps) {
  const exercises = session.exercises.filter((exercise) => exercise.removedAt === null);
  const plannedSetCount = exercises.reduce((total, exercise) => total + exercise.setCount, 0);
  const recordedSetCount = exercises.reduce((total, exercise) => total + exercise.setResults.length, 0);
  const isPaused = session.status === "PAUSED";
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const selectedExercise = availableExercises.find((exercise) => exercise.id === selectedExerciseId);

  function completeSession() {
    if (recordedSetCount < plannedSetCount && !window.confirm("还有未记录的目标组。完成后它们会按未完成计算，确定结束训练吗？")) return;
    void onComplete();
  }

  return (
    <section className="workspace-section training-section" aria-labelledby="training-title">
      <header className="section-heading training-heading">
        <div>
          <p className="section-kicker">{isPaused ? "训练已挂起" : "训练进行中"}</p>
          <h1 id="training-title">完成每组后点击一次即可记录。</h1>
        </div>
        <div className="session-actions">
          <button className="action-button" type="button" disabled={busy} onClick={isPaused ? onResume : onPause}>
            {isPaused ? "继续训练" : "挂起"}
          </button>
          <button className="action-button primary" type="button" disabled={busy} onClick={completeSession}>结束训练</button>
        </div>
      </header>

      <div className="session-summary" data-testid="active-session">
        <div><span>完成组数</span><strong>{recordedSetCount} / {plannedSetCount}</strong></div>
        <div><span>训练日期</span><strong>{session.localStartDate}</strong></div>
        <div><span>动作数</span><strong>{exercises.length}</strong></div>
        <div><span>状态</span><strong>{isPaused ? "已挂起" : "进行中"}</strong></div>
      </div>

      <form
        className="session-add-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void onAddExercise({
            exerciseId: String(data.get("exerciseId")),
            setCount: Number(data.get("setCount")),
            targetValue: Number(data.get("targetValue")),
            ...(selectedExercise?.resistanceType === "WEIGHTED" ? { weight: Number(data.get("weight")) } : {}),
          });
          event.currentTarget.reset();
          setSelectedExerciseId("");
        }}
      >
        <label><span>追加动作</span><select name="exerciseId" required value={selectedExerciseId} onChange={(event) => setSelectedExerciseId(event.target.value)} disabled={busy || isPaused}><option value="">选择动作</option>{availableExercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label>
        <label><span>组数</span><input name="setCount" type="number" min={1} defaultValue={3} required disabled={busy || isPaused} /></label>
        <label><span>{selectedExercise?.targetType === "DURATION" ? "目标秒数" : "目标次数"}</span><input name="targetValue" type="number" min={1} defaultValue={selectedExercise?.targetType === "DURATION" ? 30 : 8} required disabled={busy || isPaused} /></label>
        {selectedExercise?.resistanceType === "WEIGHTED" && <label><span>目标重量（kg）</span><input name="weight" type="number" min={0.1} step={0.1} required disabled={busy || isPaused} /></label>}
        <button className="action-button" type="submit" disabled={busy || isPaused}>追加动作</button>
      </form>

      <div className="training-list">
        {exercises.map((exercise) => {
          const results = new Map(exercise.setResults.map((result) => [result.setIndex, result]));
          return (
            <article className="training-exercise" key={exercise.id}>
              <header>
                <div>
                  <h2>{exercise.exerciseName}</h2>
                  <p>目标：{targetText(exercise)} · {exercise.setCount} 组</p>
                </div>
                <div className="training-exercise-actions">
                  {exercise.source === "ADDED" && <span className="tag">训练中追加</span>}
                  <button className="action-button compact quiet danger" type="button" disabled={busy || isPaused} onClick={() => onRemoveExercise(exercise)}>移除动作</button>
                </div>
              </header>
              <div className="set-grid">
                {Array.from({ length: exercise.setCount }, (_, index) => index + 1).map((setIndex) => {
                  const result = results.get(setIndex);
                  return (
                    <form className={`set-row ${result ? "recorded" : ""}`} key={setIndex} onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      void onRecordSet(exercise, setIndex, {
                        actualValue: Number(data.get("actualValue")),
                        ...(exercise.resistanceType === "WEIGHTED" ? { actualWeight: Number(data.get("actualWeight")) } : {}),
                      });
                    }}>
                      <span className="set-number">第 {setIndex} 组</span>
                      <label className="set-input"><span>{exercise.targetType === "REPETITIONS" ? "实际次数" : "实际秒数"}</span><input name="actualValue" type="number" min={0} defaultValue={result?.actualValue ?? exercise.targetValue} required disabled={busy || isPaused} /></label>
                      {exercise.resistanceType === "WEIGHTED" && <label className="set-input"><span>实际重量（kg）</span><input name="actualWeight" type="number" min={0.1} step={0.1} defaultValue={result?.actualWeightGrams === null || result?.actualWeightGrams === undefined ? (exercise.weightGrams ?? 0) / 1000 : result.actualWeightGrams / 1000} required disabled={busy || isPaused} /></label>}
                      <span className="set-result">{resultText(exercise, result)}</span>
                      <button className="action-button compact" type="submit" disabled={busy || isPaused}>{result ? "更新记录" : "记录完成"}</button>
                      <button className="action-button compact quiet" type="button" disabled={busy || isPaused} onClick={() => onRecordSet(exercise, setIndex, null)}>
                        跳过
                      </button>
                    </form>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
