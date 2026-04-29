import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { requireServerSecurityEnv } from "@/lib/security/env";
import { createAdminSessionToken, getSessionCookieName } from "@/lib/security/session";
import { consumeRateLimit, getRetryAfterSeconds } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function safeCompare(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

async function getClientIdentifier(): Promise<string> {
  const headerStore = await headers();
  const cfConnectingIp = headerStore.get("cf-connecting-ip");
  const forwardedFor = headerStore.get("x-forwarded-for");
  return cfConnectingIp ?? forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  let env;
  try {
    env = requireServerSecurityEnv();
  } catch {
    return NextResponse.json({ error: "Admin auth not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const rateKey = `admin-login:${await getClientIdentifier()}:${parsed.data.username.toLowerCase()}`;
  const allowed = consumeRateLimit(rateKey, 5, 5 * 60 * 1000);

  if (!allowed) {
    const retryAfter = getRetryAfterSeconds(rateKey);
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  const isUsernameValid = safeCompare(env.ADMIN_USERNAME, parsed.data.username);
  const isPasswordValid = safeCompare(env.ADMIN_PASSWORD, parsed.data.password);

  if (!isUsernameValid || !isPasswordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAdminSessionToken(
    {
      sub: env.ADMIN_USERNAME,
      role: "super_admin",
    },
    env.ADMIN_SESSION_SECRET,
  );

  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
