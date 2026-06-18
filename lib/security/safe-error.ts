import { isDevelopment } from "@/lib/env";

export const GENERIC_USER_ERROR = "処理に失敗しました。時間をおいて再試行してください。";
export const RATE_LIMIT_USER_ERROR = "短時間に操作が集中しています。時間をおいて再試行してください。";

const INTERNAL_ERROR_PATTERNS = [
  /PGRST/i,
  /violates/i,
  /duplicate key/i,
  /row-level security/i,
  /product limit exceeded/i,
  /ショップ作成失敗/i,
  /JWT/i,
  /Postgrest/i,
  /permission denied/i,
  /Missing environment variable/i
];

export function isInternalErrorMessage(message: string) {
  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function toUserFacingError(error: unknown, fallback = GENERIC_USER_ERROR): string {
  if (error instanceof Error) {
    if (error.message === RATE_LIMIT_USER_ERROR) return error.message;
    if (!isInternalErrorMessage(error.message)) return error.message;
    if (isDevelopment()) return error.message;
  }
  if (isDevelopment() && typeof error === "string" && error.trim()) return error;
  return fallback;
}

export function throwUserFacing(error: unknown, fallback = GENERIC_USER_ERROR): never {
  throw new Error(toUserFacingError(error, fallback));
}