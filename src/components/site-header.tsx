import Image from "next/image";
import Link from "next/link";
import { resolveAdminSession } from "@/lib/security/auth-context";

export async function SiteHeader() {
  let isAdmin = false;
  try {
    const session = await resolveAdminSession();
    isAdmin = !!session;
  } catch {
    isAdmin = false;
  }
  return (
    <header className="border-b border-cyan-300/15 bg-[#030813]/85 backdrop-blur supports-backdrop-filter:bg-[#030813]/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="CyberSystema"
            width={36}
            height={36}
            priority
            sizes="36px"
            className="h-9 w-9 rounded-md shadow-[0_0_12px_rgba(34,211,238,0.35)]"
          />
          <span className="font-display text-sm tracking-[0.32em] text-cyan-100 group-hover:text-cyan-200">
            CYBERSYSTEMA
          </span>
        </Link>
        <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-[0.22em] text-cyan-100/70 sm:flex">
          <Link href="/" className="hover:text-cyan-100">Home</Link>
          <Link href="/projects" className="hover:text-cyan-100">Projects</Link>
          <Link href="/about" className="hover:text-cyan-100">About</Link>
          <Link href="/contact" className="hover:text-cyan-100">Contact</Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-md border border-cyan-300/40 px-3 py-1 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)] hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
