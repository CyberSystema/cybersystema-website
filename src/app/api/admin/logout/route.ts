import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getServerSecurityEnv } from "@/lib/security/env";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import {
  getSessionCookieName,
  verifyAdminSessionToken,
} from "@/lib/security/session";
import { revokeJti } from "@/lib/security/session-revocation";
import { getCsrfCookieName } from "@/lib/security/csrf";
import { writeAudit } from "@/lib/security/audit";
import { hashIp } from "@/lib/security/ip-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const env = getServerSecurityEnv();
  const cf = await getCloudflareEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (env && token) {
    const claims = await verifyAdminSessionToken(token, env.ADMIN_SESSION_SECRET);
    if (claims && cf?.SECURITY_KV) {
      await revokeJti(cf.SECURITY_KV, claims.jti, claims.exp);
      if (cf.DB) {
        const headerStore = await headers();
        const ip = headerStore.get("cf-connecting-ip") ?? "unknown";
        const ipHash = await hashIp(ip, env.ADMIN_SESSION_SECRET);
        await writeAudit(cf.DB, {
          actorUserId: claims.sub,
          action: "admin.logout",
          resourceType: "admin_users",
          resourceId: claims.sub,
          sourceIpHash: ipHash,
        });
      }
    }
  }

  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(getCsrfCookieName(), "", {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}
