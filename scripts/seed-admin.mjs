#!/usr/bin/env node
// Seed an admin user into the local or remote D1 database.
// Usage:
//   node scripts/seed-admin.mjs --username <name> --password <pwd> [--role super_admin] [--remote]
// Requires: wrangler in PATH and authenticated for --remote.

import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return args[i + 1];
}
const remote = args.includes("--remote");
const username = arg("username");
const password = arg("password");
const role = arg("role", "super_admin");

if (!username || !password) {
  console.error("Usage: node scripts/seed-admin.mjs --username <name> --password <pwd> [--role super_admin|content_admin|read_only] [--remote]");
  process.exit(1);
}
if (password.length < 14) {
  console.error("Password must be at least 14 characters.");
  process.exit(1);
}
if (!/^(super_admin|content_admin|read_only)$/.test(role)) {
  console.error("Role must be super_admin, content_admin or read_only.");
  process.exit(1);
}

const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const salt = new Uint8Array(SALT_BYTES);
crypto.getRandomValues(salt);
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits"],
);
const derived = new Uint8Array(
  await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BYTES * 8,
  ),
);
const b64 = (b) => Buffer.from(b).toString("base64");
const passwordHash = `pbkdf2-sha256$${ITERATIONS}$${b64(salt)}$${b64(derived)}`;
const id = crypto.randomUUID();

const sqlEscape = (v) => v.replace(/'/g, "''");
const sql = `INSERT INTO admin_users (id, username, role, password_hash, mfa_enabled, is_active)
VALUES ('${sqlEscape(id)}', '${sqlEscape(username)}', '${sqlEscape(role)}', '${sqlEscape(passwordHash)}', 0, 1)
ON CONFLICT(username) DO UPDATE SET role=excluded.role, password_hash=excluded.password_hash, is_active=1, password_changed_at=CURRENT_TIMESTAMP, failed_login_count=0, locked_until=NULL;`;

// Write SQL to a temp file so the shell doesn't try to expand `$` inside the
// PBKDF2 hash payload (e.g. `$210000$<salt>$<hash>`).
const flag = remote ? "--remote" : "--local";
console.log(`> Seeding admin '${username}' (role=${role}) ${remote ? "REMOTE" : "LOCAL"}`);
const dir = mkdtempSync(join(tmpdir(), "seed-admin-"));
const sqlFile = join(dir, "seed.sql");
writeFileSync(sqlFile, sql, "utf8");
try {
  execSync(
    `npx wrangler d1 execute DB ${flag} --config wrangler.toml --file ${JSON.stringify(sqlFile)}`,
    { stdio: "inherit" },
  );
} finally {
  try { unlinkSync(sqlFile); } catch { /* ignore */ }
}
console.log("Done. The admin can now log in and enroll MFA from /admin/security.");
