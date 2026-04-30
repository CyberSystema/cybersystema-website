import ContactForm from "./form";

export const metadata = { title: "Contact · CyberSystema" };
export const runtime = "nodejs";

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-14">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.45em] text-cyan-300/70">{"// contact //"}</p>
        <h1 className="font-display text-4xl tracking-[0.14em] text-cyan-100">Contact</h1>
        <p className="font-mono text-sm text-cyan-100/75">Send a secure message to the CyberSystema team.</p>
      </header>
      <ContactForm turnstileSiteKey={siteKey} />
    </main>
  );
}
