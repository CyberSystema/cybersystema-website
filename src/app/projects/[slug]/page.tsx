import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { findProjectBySlug } from "@/lib/data/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ProjectDetailPage({ params }: Params) {
  const { slug } = await params;
  const cf = await getCloudflareEnv();
  if (!cf?.DB) notFound();
  const project = await findProjectBySlug(cf.DB, slug);
  if (!project || project.published_at === null || project.status === "archived" || project.status === "planned") {
    notFound();
  }
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-14">
      <Link href="/projects" className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300/70 hover:text-cyan-200">← Back to projects</Link>
      <header className="space-y-2">
        <h1 className="font-display text-4xl tracking-[0.14em] text-cyan-100">{project.name}</h1>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300/70">{project.status}</p>
        <p className="font-mono text-sm text-cyan-100/85">{project.summary}</p>
      </header>
      <article className="whitespace-pre-wrap rounded-xl border border-cyan-300/20 bg-slate-950/55 p-5 font-mono text-sm text-cyan-100/85">
        {project.description_md}
      </article>
      <div className="flex flex-wrap gap-2">
        {project.external_url ? (
          <a className="cyber-btn" href={project.external_url} target="_blank" rel="noopener noreferrer">Visit project</a>
        ) : null}
        {project.repository_url ? (
          <a className="cyber-btn" href={project.repository_url} target="_blank" rel="noopener noreferrer">Source</a>
        ) : null}
      </div>
    </main>
  );
}
