-- Migration 0002: harden admin_users, add MFA + lockout fields, plus operational tables
-- All tables remain idempotent so the file can be re-applied safely.

ALTER TABLE admin_users ADD COLUMN password_changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE admin_users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN locked_until TEXT;
ALTER TABLE admin_users ADD COLUMN mfa_secret_encrypted TEXT;
ALTER TABLE admin_users ADD COLUMN recovery_codes_hash TEXT;

CREATE TABLE IF NOT EXISTS revoked_sessions (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  revoked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_revoked_sessions_expires ON revoked_sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  username_lower TEXT NOT NULL,
  source_ip_hash TEXT NOT NULL,
  succeeded INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username_lower, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(source_ip_hash, created_at);
