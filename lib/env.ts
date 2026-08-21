export function requireEnv(name: string) {
  const value = name === "DATABASE_URL"
            ? process.env.DATABASE_URL
            : name === "NEON_AUTH_BASE_URL"
              ? process.env.NEON_AUTH_BASE_URL ?? process.env.VITE_NEON_AUTH_URL
          : name === "NEXT_PUBLIC_SITE_URL"
            ? process.env.NEXT_PUBLIC_SITE_URL
            : name === "RATE_LIMIT_SALT"
              ? process.env.RATE_LIMIT_SALT
              : process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment() {
  return process.env.NODE_ENV === "development";
}
