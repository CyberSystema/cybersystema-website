import Link from "next/link";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { listProjects } from "@/lib/data/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Projects · CyberSystema" };

export default async function ProjectsPage() {
  const cf = await getCloudflareEnv();
  const projects = cf?.DB ? await listProjects(cf.DB, { onlyPublished: true }) : [];
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-14">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.45em] text-cyan-300/70">{"// projects //"}</p>
        <h1 className="font-display text-4xl tracking-[0.14em] text-cyan-100">Projects</h1>
        <p className="font-mono text-sm text-cyan-100/75">Live and in-progress experiments by CyberSystema.</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.id} className="rounded-xl border border-cyan-300/25 bg-slate-950/55 p-5">
            <h2 className="font-display text-xl text-cyan-100">{p.name}</h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-cyan-300/70">{p.status}</p>
            <p className="mt-2 font-mono text-sm text-cyan-100/85">{p.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="cyber-btn" href={`/projects/${p.slug}`}>Details</Link>
              {p.external_url ? (
                <a className="cyber-btn" href={p.external_url} target="_blank" rel="noopener noreferrer">Visit</a>
              ) : null}
            </div>
          </li>
        ))}
        {projects.length === 0 ? (
          <li className="font-mono text-sm text-cyan-100/65">No projects published yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
