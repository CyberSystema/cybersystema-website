import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { findProjectBySlug } from "@/lib/data/projects";
import { Markdown } from "@/components/markdown";

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
        <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/75">CyberSystema Project</p>
        <h1 className="font-display text-4xl leading-tight tracking-widest text-cyan-100">{project.name}</h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">Status: {project.status}</p>
        <p className="font-mono text-sm leading-relaxed text-cyan-100/85">{project.summary}</p>
      </header>
      <article className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-5">
        <Markdown source={project.description_md} />
      </article>
      <div className="flex flex-wrap gap-2">
        {project.external_url ? (
          <a className="cyber-btn" href={project.external_url} target="_blank" rel="noopener noreferrer">Visit project</a>
        ) : null}
        {project.repository_url ? (
          <a className="cyber-btn" href={project.repository_url} target="_blank" rel="noopener noreferrer">Source repository</a>
        ) : null}
        {project.privacy_md ? (
          <Link className="cyber-btn" href={`/projects/${project.slug}/privacy`}>Privacy notice</Link>
        ) : null}
        {project.support_md ? (
          <Link className="cyber-btn" href={`/projects/${project.slug}/support`}>Support</Link>
        ) : null}
      </div>
    </main>
  );
}
