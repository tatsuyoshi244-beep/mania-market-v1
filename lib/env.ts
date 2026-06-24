export function requireEnv(name: string) {
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : name === "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : name === "SUPABASE_SERVICE_ROLE_KEY"
          ? process.env.SUPABASE_SERVICE_ROLE_KEY
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