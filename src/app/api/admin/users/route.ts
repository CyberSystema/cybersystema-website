import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireAdminApi } from "@/lib/security/auth-context";
import { checkCsrf, getCsrfCookieName } from "@/lib/security/csrf";
import {
  createAdmin,
  listAdmins,
  type AdminRole,
} from "@/lib/security/admin-users";
import { writeAudit } from "@/lib/security/audit";
import { hashIp } from "@/lib/security/ip-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(14).max(512),
  role: z.enum(["super_admin", "content_admin", "read_only"]),
});

export async function GET(request: Request) {
  const ctx = await requireAdminApi(request, ["super_admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const users = await listAdmins(ctx.cf.DB);
  // Strip secrets before returning.
  const sanitized = users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    mfa_enabled: u.mfa_enabled === 1,
    is_active: u.is_active === 1,
    failed_login_count: u.failed_login_count,
    locked_until: u.locked_until,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
  }));
  return NextResponse.json({ users: sanitized });
}

export async function POST(request: Request) {
  const ctx = await requireAdminApi(request, ["super_admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const cookieStore = await cookies();
  if (!checkCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }
  try {
    const created = await createAdmin(ctx.cf.DB, {
      username: parsed.data.username,
      password: parsed.data.password,
      role: parsed.data.role as AdminRole,
    });
    const ipHash = await hashIp(ctx.ip, ctx.env.ADMIN_SESSION_SECRET);
    await writeAudit(ctx.cf.DB, {
      actorUserId: ctx.session.user.id,
      action: "admin.user.create",
      resourceType: "admin_users",
      resourceId: created.id,
      sourceIpHash: ipHash,
      metadata: { username: created.username, role: created.role },
    });
    return NextResponse.json({
      user: {
        id: created.id,
        username: created.username,
        role: created.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not create user", reason: String(error) },
      { status: 400 },
    );
  }
}
