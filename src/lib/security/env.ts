import { z } from "zod";

const serverEnvSchema = z.object({
  ADMIN_USERNAME: z.string().min(3),
  ADMIN_PASSWORD: z.string().min(14),
  ADMIN_SESSION_SECRET: z.string().min(32),
});

export type ServerSecurityEnv = z.infer<typeof serverEnvSchema>;

export function getServerSecurityEnv(): ServerSecurityEnv | null {
  const parsed = serverEnvSchema.safeParse({
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function requireServerSecurityEnv(): ServerSecurityEnv {
  const env = getServerSecurityEnv();

  if (!env) {
    throw new Error("Missing admin security environment variables.");
  }

  return env;
}
