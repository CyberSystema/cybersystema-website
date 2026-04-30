import { NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { listProjects } from "@/lib/data/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cf = await getCloudflareEnv();
  if (!cf?.DB) {
    return NextResponse.json({ projects: [] });
  }
  const projects = await listProjects(cf.DB, { onlyPublished: true });
  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      summary: p.summary,
      status: p.status,
      featured: p.featured === 1,
      external_url: p.external_url,
      published_at: p.published_at,
    })),
  });
}
