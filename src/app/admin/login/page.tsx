"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(payload?.error ?? "Login failed");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-16">
      <div className="w-full rounded-xl border border-cyan-300/30 bg-slate-950/70 p-8 shadow-[0_0_42px_rgba(30,185,255,0.18)]">
        <h1 className="font-display text-2xl tracking-[0.14em] text-cyan-100">ADMIN ACCESS</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/65">
          Restricted control plane
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-cyan-200/80">Username</span>
            <input
              className="w-full rounded-md border border-cyan-400/35 bg-slate-900/80 px-3 py-2 font-mono text-cyan-100 outline-none ring-cyan-300/45 transition focus:ring-2"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-cyan-200/80">Password</span>
            <input
              className="w-full rounded-md border border-cyan-400/35 bg-slate-900/80 px-3 py-2 font-mono text-cyan-100 outline-none ring-cyan-300/45 transition focus:ring-2"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="font-mono text-xs text-red-300">{error}</p> : null}

          <button
            className="cyber-btn w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
      </div>
    </main>
  );
}
