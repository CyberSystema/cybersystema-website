import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-cyan-300/15 bg-[#030813]/80">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="CyberSystema"
              width={32}
              height={32}
              sizes="32px"
              className="h-8 w-8 rounded-md"
            />
            <p className="font-display text-sm tracking-[0.28em] text-cyan-100">CYBERSYSTEMA</p>
          </div>
          <p className="mt-3 max-w-xs font-mono text-xs leading-relaxed text-cyan-100/65">
            An independent technology organization building secure, edge-native software.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/65">Organization</p>
          <ul className="mt-3 space-y-2 font-mono text-xs text-cyan-100/75">
            <li><Link href="/about" className="hover:text-cyan-100">About</Link></li>
            <li><Link href="/projects" className="hover:text-cyan-100">Projects</Link></li>
            <li><Link href="/contact" className="hover:text-cyan-100">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/65">Resources</p>
          <ul className="mt-3 space-y-2 font-mono text-xs text-cyan-100/75">
            <li>
              <a
                href="https://github.com/CyberSystema"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-100"
              >
                GitHub Organization
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cyan-300/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/55">
          <span>© {year} CyberSystema. All rights reserved.</span>
          <span>Operated on Cloudflare global edge.</span>
        </div>
      </div>
    </footer>
  );
}
