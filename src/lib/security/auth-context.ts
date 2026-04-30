// High-level helpers for resolving the admin session in server contexts.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { getServerSecurityEnv, requireServerSecurityEnv } from "@/lib/security/env";
import { findAdminById, type AdminRole, type AdminUserRecord } from "@/lib/security/admin-users";
import {
  getSessionCookieName,
  verifyAdminSessionToken,
  type AdminSessionClaims,
} from "@/lib/security/session";
import { isJtiRevoked } from "@/lib/security/session-revocation";

export type ResolvedSession = {
  claims: AdminSessionClaims;
  user: AdminUserRecord;
};

export async function resolveAdminSession(): Promise<ResolvedSession | null> {
  const env = getServerSecurityEnv();
  if (!env) return null;
  const cf = await getCloudflareEnv();
  if (!cf?.DB || !cf?.SECURITY_KV) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;

  const claims = await verifyAdminSessionToken(token, env.ADMIN_SESSION_SECRET);
  if (!claims) return null;

  if (await isJtiRevoked(cf.SECURITY_KV, claims.jti)) return null;

  const user = await findAdminById(cf.DB, claims.sub);
  if (!user || user.is_active !== 1) return null;

  return { claims, user };
}

export async function requireAdminPage(allowed: AdminRole[] = []): Promise<ResolvedSession> {
  const env = getServerSecurityEnv();
  if (!env) {
    redirect("/admin/login?setup=1");
  }
  const session = await resolveAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (allowed.length > 0 && !allowed.includes(session.user.role)) {
    redirect("/admin?denied=1");
  }
  return session;
}

export type AdminApiContext = {
  session: ResolvedSession;
  env: NonNullable<ReturnType<typeof requireServerSecurityEnv>>;
  cf: NonNullable<Awaited<ReturnType<typeof getCloudflareEnv>>>;
  ip: string;
};

export async function requireAdminApi(
  request: Request,
  allowed: AdminRole[] = [],
): Promise<AdminApiContext | NextResponse> {
  let env;
  try {
    env = requireServerSecurityEnv();
  } catch {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const cf = await getCloudflareEnv();
  if (!cf?.DB || !cf?.SECURITY_KV) {
    return NextResponse.json({ error: "Backend not provisioned" }, { status: 503 });
  }
  const session = await resolveAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (allowed.length > 0 && !allowed.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const headerStore = await headers();
  const ip = headerStore.get("cf-connecting-ip") ?? "unknown";

  void request;
  return { session, env, cf, ip };
}