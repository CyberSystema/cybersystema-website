import type { MetadataRoute } from "next";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { listProjects } from "@/lib/data/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cf = await getCloudflareEnv();
  const projects = cf?.DB ? await listProjects(cf.DB, { onlyPublished: true }) : [];
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: "/", lastModified: now },
    { url: "/projects", lastModified: now },
    { url: "/contact", lastModified: now },
    ...projects.map((p) => ({
      url: `/projects/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : now,
    })),
  ];
  return entries;
}
