import Link from "next/link";

import { AuthShell } from "../../auth-shell";

const errorCopy: Record<string, string> = {
  TOKEN_EXPIRED: "验证链接已过期。请返回登录页重新发送验证邮件。",
  INVALID_TOKEN: "验证链接无效。请检查完整链接，或重新发送验证邮件。",
  USER_NOT_FOUND: "无法完成验证。请返回登录页重新发送验证邮件。",
};

export default async function VerifyEmailResultPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = error
    ? errorCopy[error] ?? "无法完成邮箱验证。请重新发送验证邮件。"
    : "邮箱已验证，或此验证链接此前已经使用。现在可以登录。";

  return (
    <AuthShell>
      <section className="auth-form" aria-labelledby="verification-result-title">
        <p className="eyebrow">邮箱验证</p>
        <h2 id="verification-result-title">{error ? "验证没有完成。" : "邮箱已验证。"}</h2>
        <p className={`status ${error ? "error" : "success"}`} role={error ? "alert" : "status"}>{message}</p>
        <Link className="primary-button" href="/">进入 CwFitness</Link>
      </section>
    </AuthShell>
  );
}
