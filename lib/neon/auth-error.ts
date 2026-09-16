export type AuthErrorCode =
  | "account_exists"
  | "auth"
  | "auth_origin"
  | "auth_rate_limited"
  | "auth_unavailable"
  | "signup";

type AuthErrorObject = {
  code?: unknown;
  error?: unknown;
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

function errorObject(error: unknown): AuthErrorObject {
  return error && typeof error === "object" ? error as AuthErrorObject : {};
}

function errorText(error: unknown) {
  const candidate = errorObject(error);
  const nested = errorObject(candidate.error);
  return [
    candidate.code,
    candidate.message,
    nested.code,
    nested.message,
    error instanceof Error ? error.message : undefined,
    typeof error === "string" ? error : undefined
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function errorStatus(error: unknown) {
  const candidate = errorObject(error);
  const status = candidate.status ?? candidate.statusCode;
  return typeof status === "number" ? status : Number(status) || undefined;
}

export function classifyAuthError(error: unknown, fallback: "auth" | "signup"): AuthErrorCode {
  const value = errorText(error);
  const status = errorStatus(error);

  if (/(invalid_origin|missing_or_null_origin|trusted.?origin|origin.+not.+allowed)/i.test(value)) {
    return "auth_origin";
  }
  if (status === 429 || /(too_many|rate.?limit|rate_limit|temporarily blocked)/i.test(value)) {
    return "auth_rate_limited";
  }
  if (/(already|exist|registered|duplicate|user_already_exists|既に|登録済)/i.test(value)) {
    return "account_exists";
  }
  if (status && status >= 500 || /(network|fetch failed|timeout|timed out|econn|service unavailable)/i.test(value)) {
    return "auth_unavailable";
  }
  if (/(invalid|credential|password|email|メール|パスワード|認証|validation)/i.test(value)) {
    return fallback;
  }
  return "auth_unavailable";
}

export function authErrorMessage(code?: string, context: "signin" | "signup" | "admin" = "signin") {
  if (!code) return undefined;
  if (code === "missing_fields") {
    return context === "signup"
      ? "メールアドレス・表示名・パスワードを入力してください。"
      : "メールアドレスとパスワードを入力してください。";
  }
  if (code === "weak_password") return "パスワードは8文字以上で入力してください。";
  if (code === "account_exists") return "このメールアドレスは既に登録されています。ログインしてください。";
  if (code === "auth_origin") return "サイトの認証許可設定に問題があります。運営側で復旧状況を確認しています。";
  if (code === "auth_rate_limited") return "短時間に操作が集中したため、一時的に制限されています。少し待ってからお試しください。";
  if (code === "auth_unavailable") return "認証サービスに接続できませんでした。時間をおいて、もう一度お試しください。";
  if (context === "signup") return "登録内容を確認して、もう一度お試しください。";
  if (context === "admin") return "管理者ログインに失敗しました。認証情報を確認してください。";
  return "ログインに失敗しました。メールアドレスとパスワードを確認してください。";
}
