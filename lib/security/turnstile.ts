const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstileToken(token: string | null) {
  if (!isTurnstileEnabled()) return;

  if (!token) {
    throw new Error("Bot対策の確認が必要です。");
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;

  const body = new URLSearchParams({
    secret,
    response: token
  });

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Bot対策の確認に失敗しました。");
  }

  const result = (await response.json()) as { success?: boolean };
  if (!result.success) {
    throw new Error("Bot対策の確認に失敗しました。");
  }
}