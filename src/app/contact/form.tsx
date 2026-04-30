"use client";

import { useState } from "react";

export default function ContactForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          website,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not send.");
        setStatus("error");
        return;
      }
      setStatus("ok");
      setName(""); setEmail(""); setSubject(""); setMessage(""); setTurnstileToken("");
    } catch {
      setError("Network error.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-cyan-300/25 bg-slate-950/60 p-6">
      <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
      <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} />
      <input className="input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={160} />
      <textarea className="input min-h-40" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={5000} />
      {/* Honeypot field — hidden from real users via aria + style. */}
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {turnstileSiteKey ? (
        <input
          className="input"
          placeholder="Turnstile token"
          value={turnstileToken}
          onChange={(e) => setTurnstileToken(e.target.value)}
        />
      ) : null}
      {error ? <p className="font-mono text-xs text-red-300" role="alert">{error}</p> : null}
      {status === "ok" ? <p className="font-mono text-xs text-emerald-300">Message sent. We will get back to you soon.</p> : null}
      <button className="cyber-btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send message"}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(34, 211, 238, 0.35);
          background: rgba(8, 14, 28, 0.85);
          padding: 0.6rem 0.85rem;
          color: #cdefff;
          font-family: var(--font-mono, ui-monospace);
          font-size: 0.9rem;
          outline: none;
        }
        .input:focus { box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.45); }
      `}</style>
    </form>
  );
}
