"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/client/csrf";
import type { ContactRecord, ContactStatus } from "@/lib/data/contact";

const STATUSES: ContactStatus[] = ["new", "reviewed", "closed"];

export default function ContactAdminClient({
  initialContacts,
  canEdit,
  canDelete,
}: {
  initialContacts: ContactRecord[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);

  async function setStatus(id: string, status: ContactStatus) {
    const r = await csrfFetch(`/api/admin/contact/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this submission?")) return;
    const r = await csrfFetch(`/api/admin/contact/${id}`, { method: "DELETE" });
    if (r.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-[0.14em] text-cyan-100">CONTACT QUEUE</h1>
        <a className="cyber-btn" href="/admin">Back</a>
      </header>

      <ul className="grid gap-3">
        {contacts.map((c) => (
          <li key={c.id} className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg text-cyan-100">{c.subject}</p>
                <p className="font-mono text-xs text-cyan-100/70">
                  {c.name} · {c.email} · {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit ? (
                  <select
                    className="rounded-md border border-cyan-300/35 bg-slate-900/80 px-2 py-1 font-mono text-xs text-cyan-100"
                    value={c.status}
                    onChange={(e) => setStatus(c.id, e.target.value as ContactStatus)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className="font-mono text-xs text-cyan-200/80">{c.status}</span>
                )}
                {canDelete ? (
                  <button className="cyber-btn" onClick={() => remove(c.id)}>Delete</button>
                ) : null}
              </div>
            </header>
            <p className="mt-3 whitespace-pre-wrap font-mono text-sm text-cyan-100/85">{c.message}</p>
          </li>
        ))}
        {contacts.length === 0 ? (
          <li className="font-mono text-xs text-cyan-100/60">No submissions yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
