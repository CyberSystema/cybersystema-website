// Append a row to audit_logs. Best-effort: failures are logged but don't fail
// the request — auditing must never block a privileged action.

export type AuditEntry = {
  actorUserId: string | null;
  action: string; // verb + resource (e.g. "admin.login.success")
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  sourceIpHash?: string | null;
};

export async function writeAudit(db: D1Database, entry: AuditEntry): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const metadataJson = entry.metadata ? JSON.stringify(entry.metadata) : null;
    await db
      .prepare(
        `INSERT INTO audit_logs
           (id, actor_user_id, action, resource_type, resource_id, metadata_json, source_ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        entry.actorUserId,
        entry.action,
        entry.resourceType,
        entry.resourceId ?? null,
        metadataJson,
        entry.sourceIpHash ?? null,
      )
      .run();
  } catch (error) {
    console.error("audit_log_write_failed", { error: String(error), action: entry.action });
  }
}

export type AuditRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata_json: string | null;
  source_ip_hash: string | null;
  created_at: string;
};

export async function listAudit(db: D1Database, limit = 200): Promise<AuditRow[]> {
  const result = await db
    .prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?")
    .bind(Math.min(Math.max(1, limit), 1000))
    .all<AuditRow>();
  return result.results ?? [];
}
