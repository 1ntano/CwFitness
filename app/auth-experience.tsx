"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { name: string; email: string };
type Plan = { id: string; name: string; createdAt: string };
type AuthMode = "sign-in" | "sign-up";

async function errorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? "操作没有完成，请稍后重试。";
}

export function AuthExperience() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState("");

  async function loadSession() {
    const response = await fetch("/api/auth/get-session", { cache: "no-store" });
    const session = (await response.json()) as { user?: User } | null;
    if (!session?.user) return false;
    setUser(session.user);
    const plansResponse = await fetch("/api/plans", { cache: "no-store" });
    if (plansResponse.ok) {
      const body = (await plansResponse.json()) as { plans: Plan[] };
      setPlans(body.plans);
    }
    return true;
  }

  useEffect(() => {
    // Session restoration completes asynchronously after the initial render.`n    // eslint-disable-next-line react-hooks/set-state-in-effect`n    void loadSession();
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      ...(mode === "sign-up" ? { name: String(form.get("name")) } : {}),
      email: String(form.get("email")),
      password: String(form.get("password")),
    };
    const response = await fetch(`/api/auth/${mode}/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage(await errorMessage(response));
      setBusy(false);
      return;
    }
    const loaded = await loadSession();
    setMessage(loaded ? "已进入你的训练空间。" : "登录成功，正在恢复会话…");
    setBusy(false);
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/plans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: String(data.get("planName")) }),
    });
    if (!response.ok) {
      setMessage(await errorMessage(response));
    } else {
      const body = (await response.json()) as { plan: Plan };
      setPlans((current) => [body.plan, ...current]);
      setMessage("训练计划已保存。不同账户只能看到自己的计划。");
      form.reset();
    }
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/sign-out", { method: "POST" });
    setUser(null);
    setPlans([]);
    setMessage("");
    setBusy(false);
  }

  return (
    <main className="app-shell">
      <div className="grain" aria-hidden="true" />
      <a className="brand" href="#main-content" aria-label="CwFitness 首页">
        <span className="brand-mark" aria-hidden="true" />
        CwFitness
      </a>
      <section className="split-layout" id="main-content">
        <div className="story">
          <p className="eyebrow">下一组，由你定义</p>
          <h1>每一次完成，<br />都有迹可循。</h1>
          <p>围绕你的训练计划记录每一组，在恰当的时间看见真正的进步。</p>
        </div>
        <div className="content-side">
          {user ? (
            <section className="dashboard" aria-labelledby="dashboard-title">
              <header className="dashboard-header">
                <div>
                  <p className="eyebrow">欢迎回来，{user.name}</p>
                  <h2 id="dashboard-title">你的训练计划。</h2>
                  <p className="intro">这是后端闭环测试页。先建立一个计划，确认数据属于当前账户。</p>
                </div>
                <button className="quiet-button" type="button" onClick={signOut} disabled={busy}>退出</button>
              </header>
              <form className="plan-form" onSubmit={createPlan} data-testid="plan-form">
                <label className="field">
                  <span className="field-label">新计划名称</span>
                  <span className="input-wrap"><input name="planName" placeholder="例如：力量基础" required maxLength={80} /></span>
                </label>
                <button className="primary-button compact" type="submit" disabled={busy}>{busy ? "保存中…" : "创建计划"}</button>
              </form>
              <div className="plan-list" aria-live="polite">
                {plans.length === 0 ? <p className="empty">还没有计划。创建第一个计划开始测试。</p> : plans.map((plan) => (
                  <article className="plan-card" key={plan.id}>
                    <span>Workout Plan</span><h3>{plan.name}</h3><p>下一步将加入训练日与动作。</p>
                  </article>
                ))}
              </div>
              {message && <p className="status" role="status">{message}</p>}
            </section>
          ) : (
            <form className="auth-form" onSubmit={submitAuth} data-testid="auth-form">
              <p className="eyebrow">{mode === "sign-in" ? "欢迎回来" : "建立你的训练空间"}</p>
              <h2>{mode === "sign-in" ? "继续训练。" : "从第一组开始。"}</h2>
              <p className="intro">{mode === "sign-in" ? "登录以查看今天的计划，并从上次结束的地方继续。" : "你的计划和训练记录会安全地归属于这个账户。"}</p>
              {mode === "sign-up" && <label className="field"><span className="field-label">称呼</span><span className="input-wrap"><input name="name" autoComplete="name" placeholder="你的名字" required /></span></label>}
              <label className="field"><span className="field-label">邮箱</span><span className="input-wrap"><input name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required /></span></label>
              <label className="field">
                <span className="field-label">密码</span>
                <span className="input-wrap password-wrap">
                  <input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} placeholder="至少 8 个字符" required minLength={8} />
                  <button className="reveal" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? "隐藏" : "显示"}</button>
                </span>
              </label>
              {message && <p className="status error" role="alert">{message}</p>}
              <button className="primary-button" type="submit" disabled={busy}>{busy ? "请稍候…" : mode === "sign-in" ? "登录" : "创建账户"}</button>
              <p className="auth-switch">{mode === "sign-in" ? "第一次使用 CwFitness？" : "已经拥有账户？"}<button className="text-button" type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "创建账户" : "返回登录"}</button></p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}


