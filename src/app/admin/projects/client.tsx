"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/client/csrf";
import type { ProjectRecord, ProjectStatus } from "@/lib/data/projects";

const STATUS_OPTIONS: ProjectStatus[] = ["planned", "building", "live", "archived"];

type Props = { initialProjects: ProjectRecord[]; canEdit: boolean };

const EMPTY_FORM = {
  id: "",
  slug: "",
  name: "",
  summary: "",
  description_md: "",
  external_url: "",
  repository_url: "",
  status: "planned" as ProjectStatus,
  featured: false,
  publish: false,
};

export default function ProjectsAdminClient({ initialProjects, canEdit }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function loadIntoForm(p: ProjectRecord) {
    setForm({
      id: p.id,
      slug: p.slug,
      name: p.name,
      summary: p.summary,
      description_md: p.description_md,
      external_url: p.external_url ?? "",
      repository_url: p.repository_url ?? "",
      status: p.status,
      featured: p.featured === 1,
      publish: p.published_at !== null,
    });
  }

  async function refresh() {
    const r = await fetch("/api/admin/projects", { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as { projects: ProjectRecord[] };
      setProjects(data.projects);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = {
        slug: form.slug,
        name: form.name,
        summary: form.summary,
        description_md: form.description_md,
        external_url: form.external_url || null,
        repository_url: form.repository_url || null,
        status: form.status,
        featured: form.featured,
        publish: form.publish,
      };
      const url = form.id ? `/api/admin/projects/${form.id}` : "/api/admin/projects";
      const method = form.id ? "PATCH" : "POST";
      const r = await csrfFetch(url, { method, body: JSON.stringify(payload) });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Save failed");
        return;
      }
      setForm({ ...EMPTY_FORM });
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    const r = await csrfFetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    if (r.ok) {
      await refresh();
      router.refresh();
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-[0.14em] text-cyan-100">PROJECTS</h1>
        <a className="cyber-btn" href="/admin">Back</a>
      </header>

      {canEdit ? (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-cyan-300/25 bg-slate-950/60 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            <input className="input" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <input className="input" placeholder="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required />
          <textarea className="input min-h-35" placeholder="description (markdown)" value={form.description_md} onChange={(e) => setForm({ ...form, description_md: e.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="external_url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
            <input className="input" placeholder="repository_url" value={form.repository_url} onChange={(e) => setForm({ ...form, repository_url: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="flex items-center gap-2 font-mono text-xs text-cyan-200">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
            </label>
            <label className="flex items-center gap-2 font-mono text-xs text-cyan-200">
              <input type="checkbox" checked={form.publish} onChange={(e) => setForm({ ...form, publish: e.target.checked })} /> Published
            </label>
          </div>
          {error ? <p className="font-mono text-xs text-red-300" role="alert">{error}</p> : null}
          <div className="flex gap-2">
            <button className="cyber-btn" type="submit" disabled={busy}>{form.id ? "Update" : "Create"}</button>
            {form.id ? <button type="button" className="cyber-btn" onClick={() => setForm({ ...EMPTY_FORM })}>Cancel</button> : null}
          </div>
        </form>
      ) : null}

      <ul className="grid gap-3">
        {projects.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-300/20 bg-slate-950/55 p-4">
            <div>
              <p className="font-display text-lg text-cyan-100">{p.name} <span className="font-mono text-xs text-cyan-300/65">/{p.slug}</span></p>
              <p className="font-mono text-xs text-cyan-100/70">{p.status} · {p.published_at ? "published" : "draft"} · featured: {p.featured ? "yes" : "no"}</p>
            </div>
            {canEdit ? (
              <div className="flex gap-2">
                <button className="cyber-btn" onClick={() => loadIntoForm(p)}>Edit</button>
                <button className="cyber-btn" onClick={() => onDelete(p.id)}>Delete</button>
              </div>
            ) : null}
          </li>
        ))}
        {projects.length === 0 ? (
          <li className="font-mono text-xs text-cyan-100/60">No projects yet.</li>
        ) : null}
      </ul>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(34, 211, 238, 0.35);
          background: rgba(8, 14, 28, 0.85);
          padding: 0.5rem 0.75rem;
          color: #cdefff;
          font-family: var(--font-mono, ui-monospace);
          font-size: 0.85rem;
          outline: none;
        }
        .input:focus { box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.45); }
      `}</style>
    </main>
  );
}
