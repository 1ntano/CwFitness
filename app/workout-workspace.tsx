"use client";

import { useCallback, useEffect, useState } from "react";
import { ExerciseLibrary, type NewExerciseInput } from "./exercise-library";
import { PlanEditor, type PlannedExerciseInput } from "./plan-editor";
import { TrainingPanel } from "./training-panel";
import { WorkoutHistory } from "./workout-history";
import { SettingsPanel } from "./settings-panel";
import type { Exercise, ExerciseProgress, Plan, PlannedExercise, WorkoutDay, WorkoutHistorySession, WorkoutSession, WorkspaceView } from "./workout-types";

type WorkoutWorkspaceProps = {
  user: { name: string; email: string };
  onSignOut: () => Promise<void>;
  onAccountDeleted: () => void;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "操作没有完成，请稍后重试。");
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "操作没有完成，请稍后重试。";
}

export function WorkoutWorkspace({ user, onSignOut, onAccountDeleted }: WorkoutWorkspaceProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutHistorySession[]>([]);
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [settings, setSettings] = useState<{ timeZone: string; weightUnit: "kg" | "lb" }>({ timeZone: "UTC", weightUnit: "kg" });
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [view, setView] = useState<WorkspaceView>("today");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    const [plansBody, exercisesBody, sessionBody, historyBody, settingsBody] = await Promise.all([
      apiRequest<{ plans: Plan[] }>("/api/plans", { cache: "no-store" }),
      apiRequest<{ exercises: Exercise[] }>("/api/exercises", { cache: "no-store" }),
      apiRequest<{ workoutSession: WorkoutSession | null }>("/api/workout-sessions/active", { cache: "no-store" }),
      apiRequest<{ workoutSessions: WorkoutHistorySession[] }>("/api/workout-sessions", { cache: "no-store" }),
      apiRequest<{ settings: { timeZone: string; weightUnit: "kg" | "lb" } }>("/api/settings", { cache: "no-store" }),
    ]);
    setPlans(plansBody.plans);
    setExercises(exercisesBody.exercises);
    setSession(sessionBody.workoutSession);
    setWorkoutSessions(historyBody.workoutSessions);
    setSettings(settingsBody.settings);
    setSelectedPlanId((current) => current || plansBody.plans[0]?.id || "");
    const progressBodies = await Promise.all(plansBody.plans.map((plan) => apiRequest<{ progress: ExerciseProgress[] }>(`/api/plans/${plan.id}/progress`, { cache: "no-store" })));
    setProgress(progressBodies.flatMap((body) => body.progress));
  }, []);

  useEffect(() => {
    let active = true;
    // Initial workspace data is loaded from the server after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
      .catch((error) => {
        if (active) setNotice(errorText(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadData]);

  useEffect(() => {
    if (!session || session.status !== "ACTIVE") return;
    const heartbeat = () => { void apiRequest(`/api/workout-sessions/${session.id}/heartbeat`, { method: "POST", body: "{}" }); };
    heartbeat();
    const timer = window.setInterval(heartbeat, 60_000);
    return () => window.clearInterval(timer);
  }, [session]);

  async function runMutation<T>(action: () => Promise<T>, successMessage: string) {
    setBusy(true);
    setNotice("");
    try {
      const result = await action();
      await loadData();
      setNotice(successMessage);
      return result;
    } catch (error) {
      setNotice(errorText(error));
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function createPlan(name: string) {
    const result = await runMutation(
      () => apiRequest<{ plan: Plan }>("/api/plans", { method: "POST", body: JSON.stringify({ name }) }),
      "训练计划已创建。",
    );
    if (result) setSelectedPlanId(result.plan.id);
  }

  async function renamePlan(plan: Plan, name: string) {
    await runMutation(
      () => apiRequest(`/api/plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
      "计划名称已更新。",
    );
  }

  async function createDay(plan: Plan, name: string, suggestedWeekday: number | null) {
    await runMutation(
      () => apiRequest(`/api/plans/${plan.id}/days`, {
        method: "POST",
        body: JSON.stringify({ name, suggestedWeekday }),
      }),
      "训练日已添加。",
    );
  }

  async function updateDay(plan: Plan, day: WorkoutDay, name: string, suggestedWeekday: number | null) {
    await runMutation(
      () => apiRequest(`/api/plans/${plan.id}/days/${day.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, suggestedWeekday }),
      }),
      "训练日设置已更新。",
    );
  }

  async function deleteDay(plan: Plan, day: WorkoutDay) {
    if (!window.confirm(`删除“${day.name}”？历史训练仍会保留。`)) return;
    await runMutation(
      () => apiRequest(`/api/plans/${plan.id}/days/${day.id}`, { method: "DELETE" }),
      "训练日已删除。",
    );
  }

  async function addPlannedExercise(plan: Plan, day: WorkoutDay, input: PlannedExerciseInput) {
    await runMutation(
      () => apiRequest(`/api/plans/${plan.id}/days/${day.id}/exercises`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
      "动作目标已添加。",
    );
  }

  async function updatePlannedExercise(
    plan: Plan,
    day: WorkoutDay,
    planned: PlannedExercise,
    input: Omit<PlannedExerciseInput, "exerciseId">,
  ) {
    await runMutation(
      () => apiRequest(`/api/plans/${plan.id}/days/${day.id}/exercises/${planned.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
      "动作目标已更新。",
    );
  }

  async function deletePlannedExercise(plan: Plan, day: WorkoutDay, planned: PlannedExercise) {
    if (!window.confirm(`从“${day.name}”移除“${planned.exercise.name}”？`)) return;
    await runMutation(
      () => apiRequest(`/api/plans/${plan.id}/days/${day.id}/exercises/${planned.id}`, { method: "DELETE" }),
      "动作已从训练日移除。",
    );
  }

  async function createExercise(input: NewExerciseInput) {
    await runMutation(
      () => apiRequest("/api/exercises", { method: "POST", body: JSON.stringify(input) }),
      "动作已创建。",
    );
  }

  async function renameExercise(exercise: Exercise, name: string) {
    await runMutation(
      () => apiRequest(`/api/exercises/${exercise.id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
      "动作名称已更新。",
    );
  }

  async function deleteExercise(exercise: Exercise) {
    try {
      setBusy(true);
      const impact = await apiRequest<{
        exercise: { plannedExerciseCount: number; sessionExerciseCount: number };
      }>(`/api/exercises/${exercise.id}`, { cache: "no-store" });
      setBusy(false);
      const confirmed = window.confirm(
        `永久删除“${exercise.name}”？\n影响 ${impact.exercise.plannedExerciseCount} 个计划目标和 ${impact.exercise.sessionExerciseCount} 条历史动作记录。此操作不可恢复。`,
      );
      if (!confirmed) return;
      await runMutation(
        () => apiRequest(`/api/exercises/${exercise.id}`, {
          method: "DELETE",
          body: JSON.stringify({ confirmation: "DELETE" }),
        }),
        "动作及其历史记录已永久删除。",
      );
    } catch (error) {
      setBusy(false);
      setNotice(errorText(error));
    }
  }

  async function startWorkout(day: WorkoutDay) {
    setBusy(true);
    setNotice("");
    try {
      await apiRequest<{ workoutSession: WorkoutSession }>("/api/workout-sessions", {
        method: "POST",
        body: JSON.stringify({ workoutDayId: day.id, timeZone: settings.timeZone }),
      });
      await loadData();
      setView("training");
      setNotice("训练已开始，目标已经锁定。")
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function recordSet(exercise: WorkoutSession["exercises"][number], setIndex: number, input: { actualValue: number; actualWeight?: number } | null) {
    if (!session) return;
    const payload = input === null
      ? { skipped: true }
      : {
          actualValue: input.actualValue,
          ...(exercise.resistanceType === "WEIGHTED"
            ? { actualWeight: input.actualWeight, weightUnit: settings.weightUnit }
            : {}),
        };
    await runMutation(
      () => apiRequest(`/api/workout-sessions/${session.id}/exercises/${exercise.id}/sets/${setIndex}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
      input === null ? `第 ${setIndex} 组已跳过。` : `第 ${setIndex} 组已记录。`,
    );
  }

  async function setPlanArchived(plan: Plan, archived: boolean) {
    await runMutation(() => apiRequest(`/api/plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ archived }) }), archived ? "计划已归档。" : "计划已恢复。");
  }

  async function addSessionExercise(input: { exerciseId: string; setCount: number; targetValue: number; weight?: number }) {
    if (!session) return;
    await runMutation(
      () => apiRequest(`/api/workout-sessions/${session.id}/exercises`, {
        method: "POST",
        body: JSON.stringify({ ...input, ...(input.weight === undefined ? {} : { weightUnit: settings.weightUnit }) }),
      }),
      "动作已追加到本次训练。",
    );
  }

  async function removeSessionExercise(exercise: WorkoutSession["exercises"][number]) {
    if (!session || !window.confirm(`从本次训练移除“${exercise.exerciseName}”？已记录的组将不计入完成结果。`)) return;
    await runMutation(
      () => apiRequest(`/api/workout-sessions/${session.id}/exercises/${exercise.id}`, { method: "DELETE" }),
      "动作已从本次训练移除。",
    );
  }

  async function pauseWorkout() {
    if (!session) return;
    await runMutation(
      () => apiRequest(`/api/workout-sessions/${session.id}/pause`, { method: "POST", body: "{}" }),
      "训练已挂起。",
    );
  }

  async function resumeWorkout() {
    if (!session) return;
    await runMutation(
      () => apiRequest(`/api/workout-sessions/${session.id}/resume`, { method: "POST", body: "{}" }),
      "训练已继续。",
    );
  }

  async function completeWorkout() {
    if (!session) return;
    const result = await runMutation(
      () => apiRequest(`/api/workout-sessions/${session.id}/complete`, { method: "POST", body: "{}" }),
      "训练已完成。",
    );
    if (result !== undefined) setView("history");
  }

  async function saveSettings(nextSettings: { timeZone: string; weightUnit: "kg" | "lb" }) { await runMutation(() => apiRequest("/api/settings", { method: "PATCH", body: JSON.stringify(nextSettings) }), "设置已保存。"); }
  async function deleteAccount() { const result = await runMutation(() => apiRequest("/api/account", { method: "DELETE", body: JSON.stringify({ confirmation: "DELETE" }) }), "用户已删除。"); if (result !== undefined) onAccountDeleted(); }

  async function abandonWorkout() {
    if (!session) return;
    const result = await runMutation(() => apiRequest(`/api/workout-sessions/${session.id}/abandon`, { method: "POST", body: "{}" }), "训练已放弃，不计入进展。");
    if (result !== undefined) setView("today");
  }

  async function correctHistoricalSet(session: WorkoutHistorySession, exercise: WorkoutSession["exercises"][number], setIndex: number, input: { actualValue: number; actualWeight?: number } | null) {
    const payload = input === null ? { skipped: true } : { actualValue: input.actualValue, ...(exercise.resistanceType === "WEIGHTED" ? { actualWeight: input.actualWeight, weightUnit: settings.weightUnit } : {}) };
    await runMutation(
      () => apiRequest(`/api/workout-sessions/${session.id}/exercises/${exercise.id}/sets/${setIndex}`, { method: "PUT", body: JSON.stringify(payload) }),
      `第 ${setIndex} 组历史记录已修正。`,
    );
  }

  const allDays = plans.flatMap((plan) => plan.workoutDays.map((day) => ({ plan, day })));
  const suggested = allDays.find(({ day }) => day.suggestedWeekday === new Date().getDay())
    ?? allDays.find(({ day }) => day.plannedExercises.length > 0)
    ?? allDays[0]
    ?? null;

  return (
    <main className="workspace-shell">
      <div className="workspace-frame">
        <header className="workspace-topbar">
          <div className="workspace-brand">
            <span className="brand-mark" aria-hidden="true" />
            <div><strong>CwFitness</strong><span>{user.email}</span></div>
          </div>
          <nav className="workspace-nav" aria-label="主要导航">
            <button type="button" aria-current={view === "today" ? "page" : undefined} onClick={() => setView("today")}>今日</button>
            <button type="button" aria-current={view === "plans" ? "page" : undefined} onClick={() => setView("plans")}>计划</button>
            <button type="button" aria-current={view === "exercises" ? "page" : undefined} onClick={() => setView("exercises")}>动作</button>
            <button type="button" aria-current={view === "history" ? "page" : undefined} onClick={() => setView("history")}>历史</button>
            <button type="button" aria-current={view === "settings" ? "page" : undefined} onClick={() => setView("settings")}>设置</button>
            {session && <button type="button" aria-current={view === "training" ? "page" : undefined} onClick={() => setView("training")}>训练</button>}
          </nav>
          <div className="workspace-account">
            <span>{user.name}</span>
            <button className="action-button quiet" type="button" disabled={busy} onClick={onSignOut}>退出</button>
          </div>
        </header>

        {notice && <p className={`workspace-notice ${notice.includes("失败") ? "error" : ""}`} role="status">{notice}</p>}

        <div className="workspace-body">
          {loading ? <p className="loading-state">正在加载训练空间…</p> : (
            <>
              {view === "today" && (
                <section className="workspace-section" aria-labelledby="today-title">
                  <header className="section-heading">
                    <div>
                      <p className="section-kicker">今日训练</p>
                      <h1 id="today-title">{session ? "有一场训练正在进行。" : "从建议训练日开始。"}</h1>
                    </div>
                    <p>{session ? "目标已经锁定，可以继续记录。" : "也可以进入计划页选择任意训练日。"}</p>
                  </header>

                  <div className="today-layout">
                    <article className="today-primary">
                      {session ? (
                        <>
                          <p className="section-kicker">{session.status === "PAUSED" ? "已挂起" : "进行中"}</p>
                          <h2>{session.exercises.filter((exercise) => exercise.removedAt === null).length} 个动作等待记录</h2>
                          <p>{session.localStartDate} 开始 · {session.status === "PAUSED" ? "训练时间已冻结" : "训练时间正在累计"}</p>
                          <button className="action-button primary large" type="button" onClick={() => setView("training")}>继续进入训练</button>
                        </>
                      ) : suggested ? (
                        <>
                          <p className="section-kicker">{suggested.plan.name}</p>
                          <h2>{suggested.day.name}</h2>
                          <p>{suggested.day.plannedExercises.length > 0 ? `${suggested.day.plannedExercises.length} 个动作已安排` : "先为这个训练日添加动作"}</p>
                          <button className="action-button primary large" type="button" disabled={busy || suggested.day.plannedExercises.length === 0} onClick={() => startWorkout(suggested.day)}>开始训练</button>
                        </>
                      ) : (
                        <>
                          <p className="section-kicker">准备开始</p>
                          <h2>先建立动作与训练计划。</h2>
                          <p>动作定义记录方式，训练日负责安排组数和目标。</p>
                          <button className="action-button primary large" type="button" onClick={() => setView("exercises")}>创建第一个动作</button>
                        </>
                      )}
                    </article>
                    <div className="today-stats">
                      <div><span>训练计划</span><strong>{plans.length}</strong></div>
                      <div><span>动作</span><strong>{exercises.length}</strong></div>
                      <div><span>训练日</span><strong>{allDays.length}</strong></div>
                    </div>
                  </div>
                </section>
              )}

              {view === "plans" && (
                <PlanEditor
                  plans={plans}
                  exercises={exercises}
                  selectedPlanId={selectedPlanId}
                  busy={busy}
                  progress={progress}
                  weightUnit={settings.weightUnit}
                  onSelectPlan={setSelectedPlanId}
                  onCreatePlan={createPlan}
                  onRenamePlan={renamePlan}
                  onSetArchived={setPlanArchived}
                  onCreateDay={createDay}
                  onUpdateDay={updateDay}
                  onDeleteDay={deleteDay}
                  onAddPlannedExercise={addPlannedExercise}
                  onUpdatePlannedExercise={updatePlannedExercise}
                  onDeletePlannedExercise={deletePlannedExercise}
                  onStartWorkout={startWorkout}
                />
              )}

              {view === "exercises" && (
                <ExerciseLibrary
                  exercises={exercises}
                  busy={busy}
                  onCreate={createExercise}
                  onRename={renameExercise}
                  onDelete={deleteExercise}
                />
              )}

              {view === "history" && <WorkoutHistory workoutSessions={workoutSessions} busy={busy} weightUnit={settings.weightUnit} onCorrectSet={correctHistoricalSet} />}
              {view === "settings" && <SettingsPanel settings={settings} busy={busy} onSave={saveSettings} onDelete={deleteAccount} />}

              {view === "training" && session && (
                <TrainingPanel
                  session={session}
                  exercises={exercises}
                  busy={busy}
                  weightUnit={settings.weightUnit}
                  onRecordSet={recordSet}
                  onAddExercise={addSessionExercise}
                  onRemoveExercise={removeSessionExercise}
                  onPause={pauseWorkout}
                  onResume={resumeWorkout}
                  onComplete={completeWorkout}
                  onAbandon={abandonWorkout}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
