import { isDevelopment } from "@/lib/env";

type SafeLogPayload = {
  code?: string;
  message?: string;
  hint?: string;
};

function redactEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!domain) return "[redacted]";
  return `${local.slice(0, 2)}***@${domain}`;
}

function sanitizeString(value: string) {
  return value.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (email) => redactEmail(email));
}

function sanitizeUnknown(error: unknown): SafeLogPayload | string {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? sanitizeString(record.message) : undefined;
    const code = typeof record.code === "string" ? record.code : undefined;
    const hint = typeof record.hint === "string" ? sanitizeString(record.hint) : undefined;
    return { code, message, hint };
  }
  if (typeof error === "string") return sanitizeString(error);
  return "unknown error";
}

export function logServerError(context: string, error: unknown) {
  console.error(`[${context}]`, isDevelopment() ? sanitizeUnknown(error) : sanitizeUnknown(error));
}