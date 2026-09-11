"use client";

import { FormEvent, useEffect, useState } from "react";
import { WorkoutWorkspace } from "./workout-workspace";

type User = { name: string; email: string };
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
  const [message, setMessage] = useState("");

  async function loadSession() {
    const response = await fetch("/api/auth/get-session", { cache: "no-store" });
    const session = (await response.json()) as { user?: User } | null;
    if (!session?.user) return false;
    setUser(session.user);
    return true;
  }

  useEffect(() => {
    let active = true;
    // Session restoration is an external request after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSession().then((loaded) => {
      if (!active || loaded) return;
    });
    return () => {
      active = false;
    };
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
    setMessage(loaded ? "" : "登录成功，正在恢复会话…");
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (response.ok) {
      setMode("sign-in");
      setShowPassword(false);
      setUser(null);
      setMessage("");
    } else {
      setMessage(await errorMessage(response));
    }
    setBusy(false);
  }

  if (user) return <WorkoutWorkspace user={user} onSignOut={signOut} onAccountDeleted={() => setUser(null)} />;

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
        </div>
      </section>
    </main>
  );
}
