import { requireAdminPage } from "@/lib/security/auth-context";
import SecurityClient from "./client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const session = await requireAdminPage();
  return (
    <SecurityClient
      username={session.user.username}
      mfaEnabled={session.user.mfa_enabled === 1}
    />
  );
}
