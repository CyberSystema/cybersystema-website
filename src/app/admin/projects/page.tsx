import { requireAdminPage } from "@/lib/security/auth-context";
import { listProjects } from "@/lib/data/projects";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import ProjectsAdminClient from "./client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const session = await requireAdminPage(["super_admin", "content_admin", "read_only"]);
  const cf = await getCloudflareEnv();
  const projects = cf?.DB ? await listProjects(cf.DB) : [];
  const canEdit = session.user.role !== "read_only";
  return <ProjectsAdminClient initialProjects={projects} canEdit={canEdit} />;
}
