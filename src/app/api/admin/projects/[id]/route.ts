import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireAdminApi } from "@/lib/security/auth-context";
import { checkCsrf, getCsrfCookieName } from "@/lib/security/csrf";
import {
  deleteProject,
  findProjectById,
  updateProject,
  type ProjectStatus,
} from "@/lib/data/projects";
import { writeAudit } from "@/lib/security/audit";
import { hashIp } from "@/lib/security/ip-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  summary: z.string().min(1).max(280),
  description_md: z.string().min(1).max(20_000),
  privacy_md: z.string().max(40_000).nullable().optional(),
  support_md: z.string().max(40_000).nullable().optional(),
  external_url: z.string().url().max(500).nullable().optional(),
  repository_url: z.string().url().max(500).nullable().optional(),
  status: z.enum(["planned", "building", "live", "archived"]),
  featured: z.boolean().optional(),
  publish: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await requireAdminApi(request);
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const project = await findProjectById(ctx.cf.DB, id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminApi(request, ["super_admin", "content_admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const cookieStore = await cookies();
  if (!checkCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const project = await updateProject(ctx.cf.DB, id, {
    slug: parsed.data.slug,
    name: parsed.data.name,
    summary: parsed.data.summary,
    description_md: parsed.data.description_md,
    privacy_md: parsed.data.privacy_md ?? null,
    support_md: parsed.data.support_md ?? null,
    external_url: parsed.data.external_url ?? null,
    repository_url: parsed.data.repository_url ?? null,
    status: parsed.data.status as ProjectStatus,
    featured: parsed.data.featured ?? false,
    publish: parsed.data.publish ?? false,
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ipHash = await hashIp(ctx.ip, ctx.env.ADMIN_SESSION_SECRET);
  await writeAudit(ctx.cf.DB, {
    actorUserId: ctx.session.user.id,
    action: "admin.project.update",
    resourceType: "projects",
    resourceId: project.id,
    sourceIpHash: ipHash,
    metadata: { slug: project.slug },
  });
  return NextResponse.json({ project });
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await requireAdminApi(request, ["super_admin", "content_admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const cookieStore = await cookies();
  if (!checkCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }
  const { id } = await params;
  await deleteProject(ctx.cf.DB, id);
  const ipHash = await hashIp(ctx.ip, ctx.env.ADMIN_SESSION_SECRET);
  await writeAudit(ctx.cf.DB, {
    actorUserId: ctx.session.user.id,
    action: "admin.project.delete",
    resourceType: "projects",
    resourceId: id,
    sourceIpHash: ipHash,
  });
  return NextResponse.json({ success: true });
}
