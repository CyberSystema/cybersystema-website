import { requireAdminPage } from "@/lib/security/auth-context";
import { listAudit } from "@/lib/security/audit";
import { getCloudflareEnv } from "@/lib/security/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdminPage(["super_admin"]);
  const cf = await getCloudflareEnv();
  const entries = cf?.DB ? await listAudit(cf.DB, 200) : [];
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-[0.14em] text-cyan-100">AUDIT LOG</h1>
        <a className="cyber-btn" href="/admin">Back</a>
      </header>
      <div className="overflow-auto rounded-xl border border-cyan-300/20 bg-slate-950/55">
        <table className="w-full text-left font-mono text-xs text-cyan-100/85">
          <thead className="bg-slate-900/70 text-cyan-200">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-cyan-300/10">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(e.created_at).toISOString()}</td>
                <td className="px-3 py-2">{e.actor_user_id ?? "—"}</td>
                <td className="px-3 py-2">{e.action}</td>
                <td className="px-3 py-2">{e.resource_type ?? "—"}/{e.resource_id ?? "—"}</td>
                <td className="px-3 py-2">{e.source_ip_hash ?? "—"}</td>
                <td className="px-3 py-2 max-w-xs break-all">{e.metadata_json ?? "—"}</td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr><td className="px-3 py-3" colSpan={6}>No audit entries.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
