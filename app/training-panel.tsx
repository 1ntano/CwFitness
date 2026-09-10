"use client";

import type { SessionExercise, SetResult, WorkoutSession } from "./workout-types";

type TrainingPanelProps = {
  session: WorkoutSession;
  busy: boolean;
  onRecordSet: (exercise: SessionExercise, setIndex: number, skipped: boolean) => Promise<void>;
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

export function TrainingPanel({ session, busy, onRecordSet, onPause, onResume, onComplete }: TrainingPanelProps) {
  const exercises = session.exercises.filter((exercise) => exercise.removedAt === null);
  const plannedSetCount = exercises.reduce((total, exercise) => total + exercise.setCount, 0);
  const recordedSetCount = exercises.reduce((total, exercise) => total + exercise.setResults.length, 0);
  const isPaused = session.status === "PAUSED";

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
                {exercise.source === "ADDED" && <span className="tag">训练中追加</span>}
              </header>
              <div className="set-grid">
                {Array.from({ length: exercise.setCount }, (_, index) => index + 1).map((setIndex) => {
                  const result = results.get(setIndex);
                  return (
                    <div className={`set-row ${result ? "recorded" : ""}`} key={setIndex}>
                      <span className="set-number">第 {setIndex} 组</span>
                      <span className="set-result">{resultText(exercise, result)}</span>
                      <button className="action-button compact" type="button" disabled={busy || isPaused} onClick={() => onRecordSet(exercise, setIndex, false)}>
                        {result ? "按计划重记" : "按计划完成"}
                      </button>
                      <button className="action-button compact quiet" type="button" disabled={busy || isPaused} onClick={() => onRecordSet(exercise, setIndex, true)}>
                        跳过
                      </button>
                    </div>
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
