import Link from "next/link";
import Image from "next/image";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { listProjects } from "@/lib/data/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects",
  description:
    "Software products and platforms designed and operated by the CyberSystema organization.",
};

export default async function ProjectsPage() {
  const cf = await getCloudflareEnv();
  const projects = cf?.DB ? await listProjects(cf.DB, { onlyPublished: true }) : [];
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/75">Projects</p>
        <h1 className="font-display text-4xl leading-tight tracking-widest text-cyan-100 sm:text-5xl">
          Products engineered by CyberSystema
        </h1>
        <p className="max-w-2xl font-mono text-sm leading-relaxed text-cyan-100/75">
          A curated catalogue of software developed and operated by the organization. Each
          project lists its current operational status, public surface, and source where
          available.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-950/55">
            <div className="flex items-start gap-4 p-5">
              {p.image_url ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950">
                  <Image
                    src={p.image_url}
                    alt={p.image_alt ?? p.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl tracking-widest text-cyan-100">{p.name}</h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">{p.status}</p>
                <p className="mt-3 font-mono text-sm leading-relaxed text-cyan-100/85">{p.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link className="cyber-btn" href={`/projects/${p.slug}`}>Details</Link>
                  {p.external_url ? (
                    <a className="cyber-btn" href={p.external_url} target="_blank" rel="noopener noreferrer">Visit</a>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
        {projects.length === 0 ? (
          <li className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-6 font-mono text-sm text-cyan-100/65">
            No projects have been published at this time. Please check back soon.
          </li>
        ) : null}
      </ul>
    </main>
  );
}
