import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireAdminApi } from "@/lib/security/auth-context";
import { checkCsrf, getCsrfCookieName } from "@/lib/security/csrf";
import {
  changePassword,
  deleteAdmin,
  findAdminById,
  setAdminActive,
  updateAdminRole,
  type AdminRole,
} from "@/lib/security/admin-users";
import { writeAudit } from "@/lib/security/audit";
import { hashIp } from "@/lib/security/ip-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    role: z.enum(["super_admin", "content_admin", "read_only"]).optional(),
    is_active: z.boolean().optional(),
    new_password: z.string().min(14).max(512).optional(),
  })
  .refine((v) => v.role !== undefined || v.is_active !== undefined || v.new_password !== undefined, {
    message: "Provide at least one field to update.",
  });

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminApi(request, ["super_admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const cookieStore = await cookies();
  if (!checkCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const target = await findAdminById(ctx.cf.DB, id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.role && parsed.data.role !== target.role) {
    if (target.id === ctx.session.user.id) {
      return NextResponse.json({ error: "Cannot change own role" }, { status: 400 });
    }
    await updateAdminRole(ctx.cf.DB, id, parsed.data.role as AdminRole);
  }
  if (parsed.data.is_active !== undefined && (parsed.data.is_active ? 1 : 0) !== target.is_active) {
    if (target.id === ctx.session.user.id) {
      return NextResponse.json({ error: "Cannot deactivate self" }, { status: 400 });
    }
    await setAdminActive(ctx.cf.DB, id, parsed.data.is_active);
  }
  if (parsed.data.new_password) {
    await changePassword(ctx.cf.DB, id, parsed.data.new_password);
  }

  const ipHash = await hashIp(ctx.ip, ctx.env.ADMIN_SESSION_SECRET);
  await writeAudit(ctx.cf.DB, {
    actorUserId: ctx.session.user.id,
    action: "admin.user.update",
    resourceType: "admin_users",
    resourceId: id,
    sourceIpHash: ipHash,
    metadata: {
      role_changed: Boolean(parsed.data.role),
      is_active_changed: parsed.data.is_active !== undefined,
      password_changed: Boolean(parsed.data.new_password),
    },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await requireAdminApi(request, ["super_admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const cookieStore = await cookies();
  if (!checkCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }
  const { id } = await params;
  if (id === ctx.session.user.id) {
    return NextResponse.json({ error: "Cannot delete self" }, { status: 400 });
  }
  await deleteAdmin(ctx.cf.DB, id);
  const ipHash = await hashIp(ctx.ip, ctx.env.ADMIN_SESSION_SECRET);
  await writeAudit(ctx.cf.DB, {
    actorUserId: ctx.session.user.id,
    action: "admin.user.delete",
    resourceType: "admin_users",
    resourceId: id,
    sourceIpHash: ipHash,
  });
  return NextResponse.json({ success: true });
}
