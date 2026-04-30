import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/security/auth-context";
import { listContacts, type ContactStatus } from "@/lib/data/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireAdminApi(request);
  if (ctx instanceof NextResponse) return ctx;
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const allowed: ContactStatus[] = ["new", "reviewed", "closed"];
  const status =
    statusParam && (allowed as string[]).includes(statusParam)
      ? (statusParam as ContactStatus)
      : undefined;
  const contacts = await listContacts(ctx.cf.DB, status);
  return NextResponse.json({ contacts });
}
