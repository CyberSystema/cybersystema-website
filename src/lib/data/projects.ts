// Projects table data access.

export type ProjectStatus = "planned" | "building" | "live" | "archived";

export type ProjectRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description_md: string;
  privacy_md: string | null;
  support_md: string | null;
  external_url: string | null;
  repository_url: string | null;
  image_url: string | null;
  image_alt: string | null;
  status: ProjectStatus;
  featured: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listProjects(
  db: D1Database,
  options: { onlyPublished?: boolean } = {},
): Promise<ProjectRecord[]> {
  const sql = options.onlyPublished
    ? "SELECT * FROM projects WHERE status IN ('building','live') AND published_at IS NOT NULL ORDER BY featured DESC, published_at DESC"
    : "SELECT * FROM projects ORDER BY created_at DESC";
  const result = await db.prepare(sql).all<ProjectRecord>();
  return result.results ?? [];
}

export async function findProjectById(
  db: D1Database,
  id: string,
): Promise<ProjectRecord | null> {
  const row = await db
    .prepare("SELECT * FROM projects WHERE id = ? LIMIT 1")
    .bind(id)
    .first<ProjectRecord>();
  return row ?? null;
}

export async function findProjectBySlug(
  db: D1Database,
  slug: string,
): Promise<ProjectRecord | null> {
  const row = await db
    .prepare("SELECT * FROM projects WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<ProjectRecord>();
  return row ?? null;
}

export type ProjectInput = {
  slug: string;
  name: string;
  summary: string;
  description_md: string;
  privacy_md: string | null;
  support_md: string | null;
  external_url: string | null;
  repository_url: string | null;
  image_url: string | null;
  image_alt: string | null;
  status: ProjectStatus;
  featured: boolean;
  publish: boolean;
};

export async function createProject(
  db: D1Database,
  input: ProjectInput,
): Promise<ProjectRecord> {
  const id = crypto.randomUUID();
  const publishedAt = input.publish ? new Date().toISOString() : null;
  await db
    .prepare(
      `INSERT INTO projects (id, slug, name, summary, description_md, privacy_md, support_md, external_url, repository_url, image_url, image_alt, status, featured, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.slug,
      input.name,
      input.summary,
      input.description_md,
      input.privacy_md,
      input.support_md,
      input.external_url,
      input.repository_url,
      input.image_url,
      input.image_alt,
      input.status,
      input.featured ? 1 : 0,
      publishedAt,
    )
    .run();
  const created = await findProjectById(db, id);
  if (!created) throw new Error("Failed to load created project.");
  return created;
}

export async function updateProject(
  db: D1Database,
  id: string,
  input: ProjectInput,
): Promise<ProjectRecord | null> {
  const existing = await findProjectById(db, id);
  if (!existing) return null;
  const publishedAt =
    input.publish && existing.published_at === null
      ? new Date().toISOString()
      : !input.publish
        ? null
        : existing.published_at;
  await db
    .prepare(
      `UPDATE projects
         SET slug = ?, name = ?, summary = ?, description_md = ?, privacy_md = ?, support_md = ?, external_url = ?, repository_url = ?, image_url = ?, image_alt = ?, status = ?, featured = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(
      input.slug,
      input.name,
      input.summary,
      input.description_md,
      input.privacy_md,
      input.support_md,
      input.external_url,
      input.repository_url,
      input.image_url,
      input.image_alt,
      input.status,
      input.featured ? 1 : 0,
      publishedAt,
      id,
    )
    .run();
  return findProjectById(db, id);
}

export async function deleteProject(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
}
