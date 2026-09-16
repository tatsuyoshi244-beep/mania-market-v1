import "server-only";
import { createHash } from "node:crypto";

// The owner email is stored only as a one-way hash so it is not published in source.
// Additional hashes can be supplied later without changing code.
const OWNER_ADMIN_EMAIL_HASHES = new Set([
  "63e03d32246670065c7e024d43db8ec4e41db9536b2abedb93c77411ce20a948",
  ...(process.env.ADMIN_EMAIL_SHA256 ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
]);

export function isOwnerAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const hash = createHash("sha256").update(normalized, "utf8").digest("hex");
  return OWNER_ADMIN_EMAIL_HASHES.has(hash);
}
