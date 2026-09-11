import { AuthShell } from "../auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

const errorCopy: Record<string, string> = {
  INVALID_TOKEN: "重置链接无效或已过期。请返回登录页重新申请。",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; token?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const message = error ? errorCopy[error] ?? "无法使用此重置链接，请重新申请。" : "";

  return (
    <AuthShell>
      <ResetPasswordForm token={token ?? ""} initialError={message} />
    </AuthShell>
  );
}
