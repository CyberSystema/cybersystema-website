import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/security/auth-context";
import { listAudit } from "@/lib/security/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireAdminApi(request, ["super_admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const rows = await listAudit(ctx.cf.DB, 200);
  return NextResponse.json({ entries: rows });
}
