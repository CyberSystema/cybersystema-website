import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireAdminApi } from "@/lib/security/auth-context";
import { checkCsrf, getCsrfCookieName } from "@/lib/security/csrf";
import {
  deleteContact,
  updateContactStatus,
  type ContactStatus,
} from "@/lib/data/contact";
import { writeAudit } from "@/lib/security/audit";
import { hashIp } from "@/lib/security/ip-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["new", "reviewed", "closed"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminApi(request, ["super_admin", "content_admin"]);
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
  await updateContactStatus(ctx.cf.DB, id, parsed.data.status as ContactStatus);
  const ipHash = await hashIp(ctx.ip, ctx.env.ADMIN_SESSION_SECRET);
  await writeAudit(ctx.cf.DB, {
    actorUserId: ctx.session.user.id,
    action: "admin.contact.update",
    resourceType: "contact_submissions",
    resourceId: id,
    sourceIpHash: ipHash,
    metadata: { status: parsed.data.status },
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
  await deleteContact(ctx.cf.DB, id);
  const ipHash = await hashIp(ctx.ip, ctx.env.ADMIN_SESSION_SECRET);
  await writeAudit(ctx.cf.DB, {
    actorUserId: ctx.session.user.id,
    action: "admin.contact.delete",
    resourceType: "contact_submissions",
    resourceId: id,
    sourceIpHash: ipHash,
  });
  return NextResponse.json({ success: true });
}
