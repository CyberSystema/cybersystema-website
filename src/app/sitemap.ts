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
  ];
  for (const p of projects) {
    const lastModified = p.published_at ? new Date(p.published_at) : now;
    entries.push({ url: `/projects/${p.slug}`, lastModified });
    if (p.privacy_md) entries.push({ url: `/projects/${p.slug}/privacy`, lastModified });
    if (p.support_md) entries.push({ url: `/projects/${p.slug}/support`, lastModified });
  }
  return entries;
}
