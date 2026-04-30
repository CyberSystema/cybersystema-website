"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const value = (payload as { error?: unknown }).error;
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "Login failed";
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupRequired = searchParams.get("setup") === "1";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"login" | "mfa">("login");
  const [code, setCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  async function onLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(extractErrorMessage(payload));
        return;
      }
      const data = payload as { mfa_required?: boolean };
      if (data.mfa_required) {
        setStage("mfa");
      } else {
        router.replace("/admin");
        router.refresh();
        return;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onMfaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/mfa/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(extractErrorMessage(payload));
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-16">
      <div className="w-full rounded-xl border border-cyan-300/30 bg-slate-950/70 p-8 shadow-[0_0_42px_rgba(30,185,255,0.18)]">
        <h1 className="font-display text-2xl tracking-[0.14em] text-cyan-100">ADMIN ACCESS</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/65">
          {stage === "login" ? "Restricted control plane" : "Multi-factor verification"}
        </p>

        {setupRequired ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-amber-300/45 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-200"
          >
            Admin authentication is not configured. Set ADMIN_SESSION_SECRET, apply DB migrations,
            and seed an admin user (see README).
          </p>
        ) : null}

        {stage === "login" ? (
          <form className="mt-8 space-y-4" onSubmit={onLoginSubmit}>
            <div className="space-y-2">
              <label htmlFor="admin-username" className="block font-mono text-xs uppercase tracking-[0.15em] text-cyan-200/80">Username</label>
              <input
                id="admin-username"
                className="w-full rounded-md border border-cyan-400/35 bg-slate-900/80 px-3 py-2 font-mono text-cyan-100 outline-none ring-cyan-300/45 transition focus:ring-2"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="block font-mono text-xs uppercase tracking-[0.15em] text-cyan-200/80">Password</label>
              <input
                id="admin-password"
                className="w-full rounded-md border border-cyan-400/35 bg-slate-900/80 px-3 py-2 font-mono text-cyan-100 outline-none ring-cyan-300/45 transition focus:ring-2"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {TURNSTILE_SITE_KEY ? (
              <div className="space-y-1">
                <label className="block font-mono text-xs uppercase tracking-[0.15em] text-cyan-200/80">
                  Turnstile token
                </label>
                <input
                  className="w-full rounded-md border border-cyan-400/35 bg-slate-900/80 px-3 py-2 font-mono text-xs text-cyan-100 outline-none focus:ring-2"
                  type="text"
                  value={turnstileToken}
                  onChange={(e) => setTurnstileToken(e.target.value)}
                  placeholder="Embed Turnstile widget here"
                />
              </div>
            ) : null}

            {error ? <p className="font-mono text-xs text-red-300" role="alert">{error}</p> : null}

            <button className="cyber-btn w-full" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Authenticate"}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onMfaSubmit}>
            <div className="space-y-2">
              <label htmlFor="mfa-code" className="block font-mono text-xs uppercase tracking-[0.15em] text-cyan-200/80">
                Authenticator code or recovery code
              </label>
              <input
                id="mfa-code"
                className="w-full rounded-md border border-cyan-400/35 bg-slate-900/80 px-3 py-2 font-mono text-cyan-100 outline-none ring-cyan-300/45 transition focus:ring-2"
                type="text"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            {error ? <p className="font-mono text-xs text-red-300" role="alert">{error}</p> : null}

            <button className="cyber-btn w-full" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

