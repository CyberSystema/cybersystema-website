import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "CyberSystema is an independent technology organization engineering secure, edge-native platforms.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/75">About</p>
        <h1 className="font-display text-4xl leading-tight tracking-widest text-cyan-100 sm:text-5xl">
          The CyberSystema Organization
        </h1>
        <p className="max-w-2xl font-mono text-sm leading-relaxed text-cyan-100/75">
          CyberSystema is an independent technology organization that designs, builds, and
          operates secure software at the network edge. We focus on engineering excellence,
          long-term maintainability, and uncompromising security.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <article className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-6">
          <h2 className="font-display text-xl tracking-widest text-cyan-100">Mission</h2>
          <p className="mt-3 font-mono text-sm leading-relaxed text-cyan-100/80">
            To deliver software systems that are fast, private, observable, and resilient —
            and to publish those systems openly where doing so advances the craft.
          </p>
        </article>
        <article className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-6">
          <h2 className="font-display text-xl tracking-widest text-cyan-100">Approach</h2>
          <p className="mt-3 font-mono text-sm leading-relaxed text-cyan-100/80">
            Modern standards over bespoke complexity. Type safety end-to-end. Cryptography
            with peer-reviewed primitives. Audit trails for every administrative action.
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-6">
        <h2 className="font-display text-xl tracking-widest text-cyan-100">Engineering Standards</h2>
        <ul className="mt-4 grid gap-3 font-mono text-xs leading-relaxed text-cyan-100/80 sm:grid-cols-2">
          <li>· Edge-native deployment on Cloudflare Workers</li>
          <li>· Strict Content Security Policy and security headers</li>
          <li>· PBKDF2-SHA256 password hashing with timing-safe verification</li>
          <li>· TOTP multi-factor authentication and recovery codes</li>
          <li>· JWT sessions with revocation and CSRF double-submit</li>
          <li>· Role-based access control with full audit log</li>
          <li>· Reproducible TypeScript builds and migration-managed schema</li>
          <li>· Honeypot + Cloudflare Turnstile on public submission paths</li>
        </ul>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-300/25 bg-slate-950/60 p-6">
        <div>
          <p className="font-display text-lg tracking-widest text-cyan-100">Work with us</p>
          <p className="mt-1 font-mono text-xs text-cyan-100/70">
            Engagements, partnerships, and inquiries are welcome.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="cyber-btn" href="/contact">Contact CyberSystema</Link>
          <a
            className="cyber-btn"
            href="https://github.com/CyberSystema"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Organization
          </a>
        </div>
      </section>
    </main>
  );
}
