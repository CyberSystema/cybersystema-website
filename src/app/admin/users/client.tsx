"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/client/csrf";

type Role = "super_admin" | "content_admin" | "read_only";
type SafeUser = {
  id: string;
  username: string;
  role: Role;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at: string | null;
};

const ROLES: Role[] = ["super_admin", "content_admin", "read_only"];

export default function UsersAdminClient({ initialUsers }: { initialUsers: SafeUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("content_admin");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/admin/users", { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as { users: SafeUser[] };
      setUsers(data.users);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await csrfFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    });
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Failed");
      return;
    }
    setUsername("");
    setPassword("");
    setRole("content_admin");
    await refresh();
    router.refresh();
  }

  async function setRoleFor(id: string, newRole: Role) {
    const r = await csrfFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    if (r.ok) await refresh();
  }
  async function setActive(id: string, active: boolean) {
    const r = await csrfFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: active }),
    });
    if (r.ok) await refresh();
  }
  async function remove(id: string) {
    if (!confirm("Delete this admin user?")) return;
    const r = await csrfFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (r.ok) await refresh();
  }
  async function resetPassword(id: string) {
    const pw = prompt("New password (min 14 chars):");
    if (!pw || pw.length < 14) return;
    const r = await csrfFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ new_password: pw }),
    });
    if (r.ok) alert("Password updated.");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-[0.14em] text-cyan-100">ADMIN USERS</h1>
        <a className="cyber-btn" href="/admin">Back</a>
      </header>

      <form onSubmit={onCreate} className="grid gap-3 rounded-xl border border-cyan-300/25 bg-slate-950/60 p-6 sm:grid-cols-4">
        <input className="rounded-md border border-cyan-300/35 bg-slate-900/80 px-3 py-2 font-mono text-sm text-cyan-100" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="rounded-md border border-cyan-300/35 bg-slate-900/80 px-3 py-2 font-mono text-sm text-cyan-100" placeholder="initial password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select className="rounded-md border border-cyan-300/35 bg-slate-900/80 px-3 py-2 font-mono text-sm text-cyan-100" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="cyber-btn" type="submit">Add admin</button>
        {error ? <p className="sm:col-span-4 font-mono text-xs text-red-300" role="alert">{error}</p> : null}
      </form>

      <ul className="grid gap-3">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-300/20 bg-slate-950/55 p-4">
            <div>
              <p className="font-display text-lg text-cyan-100">{u.username}</p>
              <p className="font-mono text-xs text-cyan-100/70">
                {u.role} · {u.is_active ? "active" : "disabled"} · MFA {u.mfa_enabled ? "on" : "off"} · last login {u.last_login_at ?? "—"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="rounded-md border border-cyan-300/35 bg-slate-900/80 px-2 py-1 font-mono text-xs text-cyan-100" value={u.role} onChange={(e) => setRoleFor(u.id, e.target.value as Role)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="cyber-btn" onClick={() => setActive(u.id, !u.is_active)}>{u.is_active ? "Disable" : "Enable"}</button>
              <button className="cyber-btn" onClick={() => resetPassword(u.id)}>Reset PW</button>
              <button className="cyber-btn" onClick={() => remove(u.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
