import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { findProjectBySlug } from "@/lib/data/projects";
import { Markdown } from "@/components/markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  return { title: `Privacy Notice · ${slug}`, robots: { index: true, follow: true } };
}

export default async function ProjectPrivacyPage({ params }: Params) {
  const { slug } = await params;
  const cf = await getCloudflareEnv();
  if (!cf?.DB) notFound();
  const project = await findProjectBySlug(cf.DB, slug);
  if (
    !project ||
    project.published_at === null ||
    project.status === "archived" ||
    project.status === "planned" ||
    !project.privacy_md
  ) {
    notFound();
  }
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-14">
      <Link href={`/projects/${project.slug}`} className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300/70 hover:text-cyan-200">← Back to {project.name}</Link>
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/75">Privacy Notice</p>
        <h1 className="font-display text-4xl leading-tight tracking-widest text-cyan-100">{project.name}</h1>
      </header>
      <article className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-5">
        <Markdown source={project.privacy_md} />
      </article>
    </main>
  );
}
