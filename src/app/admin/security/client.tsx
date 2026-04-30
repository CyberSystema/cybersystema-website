"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/client/csrf";

type SetupResponse = {
  otpauth_url: string;
  secret: string;
  recovery_codes: string[];
};

export default function SecurityClient({
  username,
  mfaEnabled,
}: {
  username: string;
  mfaEnabled: boolean;
}) {
  const router = useRouter();
  const [enrolment, setEnrolment] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startEnrolment() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/mfa/setup", { cache: "no-store" });
      if (!r.ok) {
        setError("Could not start enrolment.");
        return;
      }
      const data = (await r.json()) as SetupResponse;
      setEnrolment(data);
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnrolment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await csrfFetch("/api/admin/mfa/setup", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Verification failed.");
        return;
      }
      setEnrolment(null);
      setCode("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function disableMfa() {
    if (!confirm("Disable MFA on your account?")) return;
    const r = await csrfFetch("/api/admin/mfa/setup", { method: "DELETE" });
    if (r.ok) router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-[0.14em] text-cyan-100">SECURITY</h1>
        <a className="cyber-btn" href="/admin">Back</a>
      </header>

      <section className="rounded-xl border border-cyan-300/25 bg-slate-950/60 p-6">
        <h2 className="font-display text-xl text-cyan-100">Multi-factor authentication</h2>
        <p className="mt-1 font-mono text-xs text-cyan-100/70">User: {username} · MFA: {mfaEnabled ? "ENABLED" : "DISABLED"}</p>

        {mfaEnabled ? (
          <div className="mt-4 space-y-3">
            <p className="font-mono text-sm text-cyan-100/85">
              MFA is active on your account. Disabling MFA reduces account security.
            </p>
            <button className="cyber-btn" onClick={disableMfa}>Disable MFA</button>
          </div>
        ) : enrolment ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border border-cyan-300/30 bg-slate-900/70 p-3 font-mono text-xs text-cyan-100/80">
              <p className="text-cyan-200">otpauth URL:</p>
              <p className="break-all">{enrolment.otpauth_url}</p>
              <p className="mt-2 text-cyan-200">Secret (manual entry):</p>
              <p className="break-all">{enrolment.secret}</p>
            </div>
            <div className="rounded-md border border-amber-300/40 bg-amber-500/10 p-3 font-mono text-xs text-amber-200">
              <p className="font-semibold">Save these recovery codes now. They are shown only once.</p>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {enrolment.recovery_codes.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <form onSubmit={confirmEnrolment} className="flex flex-wrap items-center gap-2">
              <input
                className="rounded-md border border-cyan-300/35 bg-slate-900/80 px-3 py-2 font-mono text-sm text-cyan-100"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <button className="cyber-btn" type="submit" disabled={busy}>Confirm & enable</button>
            </form>
            {error ? <p className="font-mono text-xs text-red-300" role="alert">{error}</p> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="font-mono text-sm text-cyan-100/85">
              Enable an authenticator app (e.g. 1Password, Authy, Google Authenticator) for stronger account protection.
            </p>
            <button className="cyber-btn" onClick={startEnrolment} disabled={busy}>Begin enrolment</button>
            {error ? <p className="font-mono text-xs text-red-300" role="alert">{error}</p> : null}
          </div>
        )}
      </section>
    </main>
  );
}
