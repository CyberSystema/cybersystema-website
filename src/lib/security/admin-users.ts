// Convenience wrappers around the D1 admin_users table.

import { hashPassword, verifyPassword } from "@/lib/security/password";

export type AdminRole = "super_admin" | "content_admin" | "read_only";

export type AdminUserRecord = {
  id: string;
  username: string;
  role: AdminRole;
  password_hash: string;
  mfa_enabled: number;
  mfa_secret_encrypted: string | null;
  recovery_codes_hash: string | null;
  is_active: number;
  failed_login_count: number;
  locked_until: string | null;
  password_changed_at: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export const MAX_FAILED_LOGINS = 10;
export const LOCKOUT_MINUTES = 15;

export async function findAdminByUsername(
  db: D1Database,
  username: string,
): Promise<AdminUserRecord | null> {
  const row = await db
    .prepare("SELECT * FROM admin_users WHERE username = ? LIMIT 1")
    .bind(username)
    .first<AdminUserRecord>();
  return row ?? null;
}

export async function findAdminById(
  db: D1Database,
  id: string,
): Promise<AdminUserRecord | null> {
  const row = await db
    .prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1")
    .bind(id)
    .first<AdminUserRecord>();
  return row ?? null;
}

export async function listAdmins(db: D1Database): Promise<AdminUserRecord[]> {
  const result = await db
    .prepare("SELECT * FROM admin_users ORDER BY created_at ASC")
    .all<AdminUserRecord>();
  return result.results ?? [];
}

export async function recordFailedLogin(
  db: D1Database,
  userId: string,
  newFailureCount: number,
  lockedUntilIso: string | null,
): Promise<void> {
  await db
    .prepare(
      "UPDATE admin_users SET failed_login_count = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(newFailureCount, lockedUntilIso, userId)
    .run();
}

export async function recordSuccessfulLogin(
  db: D1Database,
  userId: string,
): Promise<void> {
  await db
    .prepare(
      "UPDATE admin_users SET failed_login_count = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(userId)
    .run();
}

export async function setMfaSecret(
  db: D1Database,
  userId: string,
  encryptedSecret: string,
  recoveryCodesHashJson: string,
): Promise<void> {
  await db
    .prepare(
      "UPDATE admin_users SET mfa_secret_encrypted = ?, recovery_codes_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(encryptedSecret, recoveryCodesHashJson, userId)
    .run();
}

export async function enableMfa(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare(
      "UPDATE admin_users SET mfa_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(userId)
    .run();
}

export async function disableMfa(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare(
      "UPDATE admin_users SET mfa_enabled = 0, mfa_secret_encrypted = NULL, recovery_codes_hash = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(userId)
    .run();
}

export async function changePassword(
  db: D1Database,
  userId: string,
  newPassword: string,
): Promise<void> {
  const hash = await hashPassword(newPassword);
  await db
    .prepare(
      "UPDATE admin_users SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(hash, userId)
    .run();
}

export async function verifyAdminPassword(
  user: AdminUserRecord,
  password: string,
): Promise<boolean> {
  return verifyPassword(password, user.password_hash);
}

export async function createAdmin(
  db: D1Database,
  input: { username: string; password: string; role: AdminRole },
): Promise<AdminUserRecord> {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);
  await db
    .prepare(
      `INSERT INTO admin_users (id, username, role, password_hash, mfa_enabled, is_active)
       VALUES (?, ?, ?, ?, 0, 1)`,
    )
    .bind(id, input.username, input.role, passwordHash)
    .run();
  const created = await findAdminById(db, id);
  if (!created) throw new Error("Failed to load created admin user.");
  return created;
}

export async function updateAdminRole(
  db: D1Database,
  userId: string,
  role: AdminRole,
): Promise<void> {
  await db
    .prepare(
      "UPDATE admin_users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(role, userId)
    .run();
}

export async function setAdminActive(
  db: D1Database,
  userId: string,
  isActive: boolean,
): Promise<void> {
  await db
    .prepare(
      "UPDATE admin_users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(isActive ? 1 : 0, userId)
    .run();
}

export async function deleteAdmin(db: D1Database, userId: string): Promise<void> {
  await db.prepare("DELETE FROM admin_users WHERE id = ?").bind(userId).run();
}
