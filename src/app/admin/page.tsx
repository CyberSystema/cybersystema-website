import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSecurityEnv } from "@/lib/security/env";
import { getSessionCookieName, verifyAdminSessionToken } from "@/lib/security/session";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const env = getServerSecurityEnv();
  if (!env) {
    redirect("/admin/login?setup=1");
  }

  const token = (await cookies()).get(getSessionCookieName())?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const session = await verifyAdminSessionToken(token, env.ADMIN_SESSION_SECRET);

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-14">
      <section className="w-full rounded-xl border border-cyan-300/30 bg-slate-950/65 p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-[0.14em] text-cyan-100">CONTROL PLANE</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-100/65">
              Authenticated as {session.sub}
            </p>
          </div>
          <form action="/api/admin/logout" method="post">
            <button className="cyber-btn" type="submit">Sign Out</button>
          </form>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="status-box">Projects: Pending Integration</article>
          <article className="status-box">Contact Queue: Pending Integration</article>
          <article className="status-box">Audit Stream: Pending Integration</article>
        </div>
      </section>
    </main>
  );
}
