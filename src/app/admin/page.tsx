import Link from "next/link";
import { requireAdminPage } from "@/lib/security/auth-context";
import { getCloudflareEnv } from "@/lib/security/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage(props: {
  searchParams?: Promise<{ denied?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const session = await requireAdminPage();
  const cf = await getCloudflareEnv();
  let projectCount = 0;
  let contactCount = 0;
  if (cf?.DB) {
    const p = await cf.DB.prepare("SELECT COUNT(*) as c FROM projects").first<{ c: number }>();
    const c = await cf.DB.prepare(
      "SELECT COUNT(*) as c FROM contact_submissions WHERE status = 'new'",
    ).first<{ c: number }>();
    projectCount = p?.c ?? 0;
    contactCount = c?.c ?? 0;
  }
  const role = session.user.role;
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-14">
      {sp.denied ? (
        <div role="alert" className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-200">
          You do not have permission to access that area.
        </div>
      ) : null}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-300/30 bg-slate-950/65 p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/65">Administrator Console</p>
          <h1 className="mt-1 font-display text-3xl tracking-[0.1em] text-cyan-100">CyberSystema Control Plane</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-100/65">
            {session.user.username} · {role.replace("_", " ")} · MFA {session.user.mfa_enabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <form action="/api/admin/logout" method="post" className="flex flex-wrap items-center gap-2">
          <Link className="cyber-btn" href="/">Public site</Link>
          <button className="cyber-btn" type="submit">Sign out</button>
        </form>
      </header>

      <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link className="cyber-btn" href="/admin/projects">Projects ({projectCount})</Link>
        <Link className="cyber-btn" href="/admin/contact">Contact Inbox ({contactCount})</Link>
        <Link className="cyber-btn" href="/admin/security">Security & MFA</Link>
        {role === "super_admin" ? (
          <>
            <Link className="cyber-btn" href="/admin/users">Administrator Accounts</Link>
            <Link className="cyber-btn" href="/admin/audit">Audit Log</Link>
          </>
        ) : null}
      </nav>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="status-box">Total projects: {projectCount}</article>
        <article className="status-box">Pending submissions: {contactCount}</article>
        <article className="status-box">Active role: {role}</article>
      </section>
    </main>
  );
}

