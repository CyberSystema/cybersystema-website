import { requireAdminPage } from "@/lib/security/auth-context";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { listContacts } from "@/lib/data/contact";
import ContactAdminClient from "./client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const session = await requireAdminPage(["super_admin", "content_admin", "read_only"]);
  const cf = await getCloudflareEnv();
  const contacts = cf?.DB ? await listContacts(cf.DB) : [];
  return (
    <ContactAdminClient
      initialContacts={contacts}
      canEdit={session.user.role !== "read_only"}
      canDelete={session.user.role === "super_admin"}
    />
  );
}
