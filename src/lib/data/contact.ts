// Contact submissions data access.

export type ContactStatus = "new" | "reviewed" | "closed";

export type ContactRecord = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  source_ip_hash: string;
  status: ContactStatus;
  created_at: string;
};

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  sourceIpHash: string;
};

export async function createContact(
  db: D1Database,
  input: ContactInput,
): Promise<ContactRecord> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO contact_submissions (id, name, email, subject, message, source_ip_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, 'new')`,
    )
    .bind(id, input.name, input.email, input.subject, input.message, input.sourceIpHash)
    .run();
  const row = await db
    .prepare("SELECT * FROM contact_submissions WHERE id = ?")
    .bind(id)
    .first<ContactRecord>();
  if (!row) throw new Error("Failed to load created contact.");
  return row;
}

export async function listContacts(
  db: D1Database,
  status?: ContactStatus,
): Promise<ContactRecord[]> {
  const result = status
    ? await db
        .prepare("SELECT * FROM contact_submissions WHERE status = ? ORDER BY created_at DESC")
        .bind(status)
        .all<ContactRecord>()
    : await db
        .prepare("SELECT * FROM contact_submissions ORDER BY created_at DESC")
        .all<ContactRecord>();
  return result.results ?? [];
}

export async function updateContactStatus(
  db: D1Database,
  id: string,
  status: ContactStatus,
): Promise<void> {
  await db
    .prepare("UPDATE contact_submissions SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
}

export async function deleteContact(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM contact_submissions WHERE id = ?").bind(id).run();
}

export async function rateLimitContactByIpHash(
  db: D1Database,
  sourceIpHash: string,
  windowMinutes: number,
  maxPerWindow: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const result = await db
    .prepare(
      "SELECT COUNT(*) as count FROM contact_submissions WHERE source_ip_hash = ? AND created_at >= ?",
    )
    .bind(sourceIpHash, since)
    .first<{ count: number }>();
  return (result?.count ?? 0) < maxPerWindow;
}
