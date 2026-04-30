import ContactForm from "./form";

export const metadata = {
  title: "Contact",
  description:
    "Reach out to CyberSystema for engagements, partnerships, or technical inquiries.",
};
export const runtime = "nodejs";

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/75">Contact</p>
        <h1 className="font-display text-4xl leading-tight tracking-widest text-cyan-100 sm:text-5xl">
          Get in touch with CyberSystema
        </h1>
        <p className="font-mono text-sm leading-relaxed text-cyan-100/75">
          Send a secure message regarding engagements, partnerships, security disclosures,
          or general inquiries. Submissions are protected by rate-limiting and bot mitigation.
        </p>
      </header>
      <ContactForm turnstileSiteKey={siteKey} />
    </main>
  );
}
