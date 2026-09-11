"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function ResetPasswordForm({ token, initialError }: { token: string; initialError: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError);
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== String(form.get("confirmPassword"))) {
      setMessage("两次输入的密码不一致。");
      return;
    }
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ newPassword, token }),
    });
    if (response.ok) {
      setComplete(true);
    } else {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "重置没有完成，请重新申请密码重置链接。");
    }
    setBusy(false);
  }

  if (complete) {
    return (
      <section className="auth-form" aria-labelledby="reset-complete-title">
        <p className="eyebrow">密码已更新</p>
        <h2 id="reset-complete-title">现在可以重新登录。</h2>
        <p className="status success" role="status">新密码已生效，其他已有登录可能已被注销。</p>
        <Link className="primary-button" href="/">返回登录</Link>
      </section>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit} aria-labelledby="reset-password-title">
      <p className="eyebrow">重置密码</p>
      <h2 id="reset-password-title">设置一个新密码。</h2>
      {!token && <p className="status error" role="alert">{message || "重置链接无效或已过期。"}</p>}
      {message && token && <p className="status error" role="alert">{message}</p>}
      {token && <>
        <label className="field"><span className="field-label">新密码</span><span className="input-wrap"><input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></span></label>
        <label className="field"><span className="field-label">确认新密码</span><span className="input-wrap"><input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></span></label>
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "请稍候…" : "更新密码"}</button>
      </>}
      <Link className="text-button" href="/">返回登录</Link>
    </form>
  );
}
