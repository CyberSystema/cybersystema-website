import { requireAdminPage } from "@/lib/security/auth-context";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { listAdmins } from "@/lib/security/admin-users";
import UsersAdminClient from "./client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdminPage(["super_admin"]);
  const cf = await getCloudflareEnv();
  const users = cf?.DB ? await listAdmins(cf.DB) : [];
  const safe = users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    is_active: u.is_active === 1,
    mfa_enabled: u.mfa_enabled === 1,
    last_login_at: u.last_login_at,
  }));
  return <UsersAdminClient initialUsers={safe} />;
}
