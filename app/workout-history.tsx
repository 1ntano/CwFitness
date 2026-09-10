"use client";

import { weightFromGrams } from "../lib/weights";
import type { SessionExercise, WorkoutHistorySession } from "./workout-types";

type WeightUnit = "kg" | "lb";

function setText(exercise: SessionExercise, setIndex: number, weightUnit: WeightUnit) {
  const result = exercise.setResults.find((item) => item.setIndex === setIndex);
  if (!result) return "未记录";
  if (result.skipped) return "已跳过";
  const value = exercise.targetType === "REPETITIONS" ? `${result.actualValue} 次` : `${result.actualValue} 秒`;
  return result.actualWeightGrams === null ? value : `${value} · ${weightFromGrams(result.actualWeightGrams, weightUnit).toFixed(1)} ${weightUnit}`;
}

function duration(seconds: number | null) {
  if (seconds === null) return "—";
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
}

type HistoryProps = {
  workoutSessions: WorkoutHistorySession[];
  busy: boolean;
  weightUnit: WeightUnit;
  onCorrectSet: (session: WorkoutHistorySession, exercise: SessionExercise, setIndex: number, input: { actualValue: number; actualWeight?: number } | null) => Promise<void>;
};

export function WorkoutHistory({ workoutSessions, busy, weightUnit, onCorrectSet }: HistoryProps) {
  return (
    <section className="workspace-section" aria-labelledby="history-title">
      <header className="section-heading">
        <div><p className="section-kicker">训练历史</p><h1 id="history-title">回顾每一次完成。</h1></div>
        <p>仅显示已完成训练；成绩按训练结束时的实际次数、秒数和重量计算。</p>
      </header>
      {workoutSessions.length === 0 ? <p className="empty-state">完成第一场训练后，结果会显示在这里。</p> : <div className="history-list">
        {workoutSessions.map((session) => (
          <details className="history-session" key={session.id} open={workoutSessions[0]?.id === session.id}>
            <summary><div><p className="section-kicker">{session.workoutPlanName}</p><h2>{session.workoutDayName}</h2><p>{session.localStartDate} · 训练 {duration(session.trainingTimeSeconds)}</p></div><span>查看记录</span></summary>
            <div className="history-results">
              {session.exerciseResults.map((result) => <div key={result.sessionExerciseId}><strong>{result.exerciseName}</strong><span>达成 {result.achievementRate}%</span><span>{result.excessTargetValue > 0 ? `超额 ${result.excessTargetValue}` : "无超额"}{result.excessWeightGrams > 0 ? ` · ${weightFromGrams(result.excessWeightGrams, weightUnit).toFixed(1)} ${weightUnit}` : ""}</span></div>)}
            </div>
            {session.exercises.filter((exercise) => exercise.removedAt === null).map((exercise) => <div className="history-exercise" key={exercise.id}><strong>{exercise.exerciseName}</strong><span>{Array.from({ length: exercise.setCount }, (_, index) => `第 ${index + 1} 组：${setText(exercise, index + 1, weightUnit)}`).join(" · ")}</span><details className="history-correction"><summary>修正实际记录</summary>{Array.from({ length: exercise.setCount }, (_, index) => index + 1).map((setIndex) => { const result = exercise.setResults.find((item) => item.setIndex === setIndex); return <form key={setIndex} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void onCorrectSet(session, exercise, setIndex, { actualValue: Number(data.get("actualValue")), ...(exercise.resistanceType === "WEIGHTED" ? { actualWeight: Number(data.get("actualWeight")) } : {}) }); }}><span>第 {setIndex} 组</span><input name="actualValue" type="number" min={0} defaultValue={result?.actualValue ?? exercise.targetValue} required disabled={busy} />{exercise.resistanceType === "WEIGHTED" && <input name="actualWeight" type="number" min={0.1} step={0.1} defaultValue={weightFromGrams(result?.actualWeightGrams ?? exercise.weightGrams ?? 0, weightUnit).toFixed(1)} required disabled={busy} />}<button className="action-button compact" type="submit" disabled={busy}>保存</button><button className="text-button" type="button" disabled={busy} onClick={() => onCorrectSet(session, exercise, setIndex, null)}>跳过</button></form>; })}</details></div>)}
          </details>
        ))}
      </div>}
    </section>
  );
}
