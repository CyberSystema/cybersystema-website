import { z } from "zod";

const serverEnvSchema = z.object({
  ADMIN_SESSION_SECRET: z.string().min(32),
  TURNSTILE_SECRET_KEY: z.string().min(10).optional(),
  TURNSTILE_SITE_KEY: z.string().min(10).optional(),
  CONTACT_NOTIFY_EMAIL: z.string().email().optional(),
});

export type ServerSecurityEnv = z.infer<typeof serverEnvSchema>;

export function getServerSecurityEnv(): ServerSecurityEnv | null {
  const parsed = serverEnvSchema.safeParse({
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
    CONTACT_NOTIFY_EMAIL: process.env.CONTACT_NOTIFY_EMAIL,
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function requireServerSecurityEnv(): ServerSecurityEnv {
  const env = getServerSecurityEnv();

  if (!env) {
    throw new Error("Missing or invalid admin security environment variables.");
  }

  return env;
}
