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
            A production-grade Next.js platform migration is in progress. Public experiences
            and a secured administrator control panel are being built for Cloudflare.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a className="cyber-btn" href="https://oknstudio.cybersystema.com" target="_blank" rel="noopener noreferrer">
            OKN Studio
          </a>
          <a className="cyber-btn" href="https://orthodox-korea-calendar.pages.dev/" target="_blank" rel="noopener noreferrer">
            Orthodox Korea Calendar
          </a>
          <a className="cyber-btn" href="https://github.com/CyberSystema" target="_blank" rel="noopener noreferrer">
            GitHub Organization
          </a>
          <a className="cyber-btn" href="/admin/login">
            Administrator Login
          </a>
        </section>

        <section className="grid gap-4 text-sm text-cyan-100/75 sm:grid-cols-3">
          <div className="status-box">System Status: Online</div>
          <div className="status-box">Mode: Secure Migration</div>
          <div className="status-box">Target: Cloudflare Free Plan</div>
        </section>
      </main>
    </div>
  );
}
