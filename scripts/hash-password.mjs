#!/usr/bin/env node
// Usage: node scripts/hash-password.mjs '<password>'
// Outputs a PBKDF2-SHA256 hash string suitable for ADMIN_PASSWORD_HASH.

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs '<password>'");
  process.exit(1);
}
if (password.length < 14) {
  console.error("Password must be at least 14 characters.");
  process.exit(1);
}

const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function base64Encode(bytes) {
  return Buffer.from(bytes).toString("base64");
}

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

console.log(`pbkdf2-sha256$${ITERATIONS}$${base64Encode(salt)}$${base64Encode(derived)}`);
