import Link from "next/link";

export const dynamic = "force-static";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#030813] px-6 py-16 text-[#cdefff]">
      <div className="absolute inset-0 cyber-grid opacity-40" />
      <div className="absolute -left-32 -top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-[110px]" />
      <div className="absolute -bottom-20 -right-16 h-96 w-96 rounded-full bg-blue-500/20 blur-[110px]" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12">
        <section className="space-y-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.45em] text-cyan-300/70">
            {"// CyberSystema Organization //"}
          </p>
          <h1 className="font-display text-5xl tracking-[0.16em] text-cyan-100 sm:text-7xl">
            CYBERSYSTEMA
          </h1>
          <p className="mx-auto max-w-2xl font-mono text-base text-cyan-100/75 sm:text-lg">
            Production-grade platform on Next.js + Cloudflare. Live projects, secure admin
            control plane with multi-factor authentication, role-based access, and audit trail.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link className="cyber-btn" href="/projects">Projects</Link>
          <Link className="cyber-btn" href="/contact">Contact</Link>
          <a className="cyber-btn" href="https://github.com/CyberSystema" target="_blank" rel="noopener noreferrer">
            GitHub Organization
          </a>
          <Link className="cyber-btn" href="/admin/login">
            Administrator Login
          </Link>
        </section>

        <section className="grid gap-4 text-sm text-cyan-100/75 sm:grid-cols-3">
          <div className="status-box">System Status: Online</div>
          <div className="status-box">Edge: Cloudflare Workers</div>
          <div className="status-box">Auth: D1 + MFA</div>
        </section>
      </main>
    </div>
  );
}

