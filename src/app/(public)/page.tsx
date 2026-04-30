import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#030813] text-[#cdefff]">
      <div className="absolute inset-0 cyber-grid opacity-40" />
      <div className="absolute -left-32 -top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-[110px]" />
      <div className="absolute -bottom-20 -right-16 h-96 w-96 rounded-full bg-blue-500/20 blur-[110px]" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-6 py-20">
        <section className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div className="space-y-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/75">
              Independent Technology Organization
            </p>
            <h1 className="font-display text-5xl leading-[1.05] tracking-[0.08em] text-cyan-100 sm:text-6xl lg:text-7xl">
              Engineering secure,
              <br />
              edge-native software.
            </h1>
            <p className="max-w-xl font-mono text-base leading-relaxed text-cyan-100/75">
              CyberSystema designs and operates resilient platforms and applications on the
              global edge — combining strong cryptography, modern web standards, and disciplined
              engineering to deliver products that perform under real-world conditions.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link className="cyber-btn" href="/projects">View Projects</Link>
              <Link className="cyber-btn" href="/about">About the Organization</Link>
              <Link className="cyber-btn" href="/contact">Get in Touch</Link>
            </div>
          </div>

          <aside className="grid gap-3 rounded-xl border border-cyan-300/25 bg-slate-950/55 p-6 font-mono text-xs text-cyan-100/80">
            <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-300/65">System Telemetry</p>
            <ul className="space-y-2">
              <li className="flex items-center justify-between border-b border-cyan-300/10 pb-2"><span>Status</span><span className="text-cyan-200">Operational</span></li>
              <li className="flex items-center justify-between border-b border-cyan-300/10 pb-2"><span>Runtime</span><span className="text-cyan-200">Cloudflare Workers</span></li>
              <li className="flex items-center justify-between border-b border-cyan-300/10 pb-2"><span>Framework</span><span className="text-cyan-200">Next.js · React 19</span></li>
              <li className="flex items-center justify-between border-b border-cyan-300/10 pb-2"><span>Datastore</span><span className="text-cyan-200">D1 · KV</span></li>
              <li className="flex items-center justify-between"><span>Auth</span><span className="text-cyan-200">PBKDF2 · TOTP MFA</span></li>
            </ul>
          </aside>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/65">01 · Edge-Native</p>
            <h2 className="mt-3 font-display text-xl tracking-widest text-cyan-100">Globally distributed</h2>
            <p className="mt-2 font-mono text-xs leading-relaxed text-cyan-100/75">
              Every system is deployed to Cloudflare&apos;s global network, serving requests
              milliseconds from the user with zero cold starts.
            </p>
          </article>
          <article className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/65">02 · Secure by Design</p>
            <h2 className="mt-3 font-display text-xl tracking-widest text-cyan-100">Defense in depth</h2>
            <p className="mt-2 font-mono text-xs leading-relaxed text-cyan-100/75">
              Hardened authentication, role-based access, multi-factor enrollment, audit
              trails, CSRF protection, and modern security headers — by default.
            </p>
          </article>
          <article className="rounded-xl border border-cyan-300/20 bg-slate-950/55 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/65">03 · Engineered to Last</p>
            <h2 className="mt-3 font-display text-xl tracking-widest text-cyan-100">Operational rigor</h2>
            <p className="mt-2 font-mono text-xs leading-relaxed text-cyan-100/75">
              Type-safe, lint-clean, reproducible builds with automated migrations and full
              audit visibility for every administrative action.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
