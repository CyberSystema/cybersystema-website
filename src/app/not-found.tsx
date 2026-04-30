import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/75">Error 404</p>
      <h1 className="font-display text-5xl tracking-widest text-cyan-100">Page not found</h1>
      <p className="font-mono text-sm leading-relaxed text-cyan-100/75">
        The page you requested could not be located. It may have been moved, archived, or never existed.
      </p>
      <Link href="/" className="cyber-btn mt-4">Return to homepage</Link>
    </main>
  );
}
