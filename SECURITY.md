# Security Policy

CyberSystema Web is intended to be developed in public, but production secrets, admin credentials, and infrastructure bindings must never be committed to the repository.

## Supported Security Posture

This repository currently supports security updates on the default branch.

## Reporting a Vulnerability

Do not open public GitHub issues for security vulnerabilities.

Instead:

1. Email the maintainers at `contact@cybersystema.com` with the subject `Security Report: CyberSystema Web`.
2. Include a clear description, impact, reproduction steps, and any proof-of-concept details.
3. If the issue involves authentication, authorization, or secret exposure, include affected routes and configuration assumptions.

## Response Expectations

- Initial acknowledgement target: 72 hours
- Triage target: 7 calendar days
- Fix timeline: depends on severity and exploitability

## Repository Security Rules

- Never commit `.env*` runtime secrets except `.env.example`.
- Never commit Cloudflare binding IDs, API tokens, or production exports unless intentionally public.
- Use placeholders in docs and examples.
- All admin and contact surfaces must remain rate-limited and validated server-side.

## Current Security Posture

- **Authentication**: D1-backed multi-user admin store; PBKDF2-SHA256 (210k iter) password hashing; per-user TOTP MFA (RFC 6238) with one-time recovery codes (SHA-256 hashed at rest); brute-force lockout (10 failed → 15 min lock).
- **Sessions**: HS256 JWTs (issuer `cybersystema:admin`) with `kind` discriminator (`session` vs `pre_mfa`), `jti` revocation in KV (`rev:<jti>`), 12 h session lifetime, 5 min pre-MFA lifetime, `__Host-` cookie scope (HttpOnly, Secure, SameSite=Strict, Path=/).
- **CSRF**: Double-submit cookie (`cs_admin_csrf`) verified via `x-csrf-token` header on every state-changing admin/MFA request.
- **MFA secret-at-rest**: AES-GCM with HKDF-derived key (info `aes-gcm-encryption`).
- **Rate limiting**: KV-backed fixed-window buckets per IP+username on login (5/5min), per IP+user on MFA verify (6/5min), per IP on public contact (5/60min) plus per IP-hash D1 throttle (3/60min).
- **IP handling**: Only `cf-connecting-ip` is trusted; IPs are HMAC-SHA256 hashed (truncated to 32 hex) before storage in audit/contact tables.
- **Audit log**: Append-only D1 `audit_logs` records all privileged actions with actor, resource, IP hash, optional metadata.
- **Captcha**: Cloudflare Turnstile verification on login and contact when configured.
- **Edge middleware**: Adds security headers, gates `/admin/**` on session cookie presence, enforces `noindex` and `Cache-Control: no-store` on admin surfaces.

## Bootstrapping

Admin users do not exist in env vars. Apply migrations and seed via:

```bash
npm run db:apply:local
npm run seed-admin -- --username admin --password '...' --role super_admin
```

Use `--remote` for production. Rotate `ADMIN_SESSION_SECRET` only with a coordinated user re-login (it invalidates all existing JWTs and re-keys the AES wrap, requiring MFA re-enrolment).

## Known Hardening Gaps

- CSP still allows `'unsafe-inline'` for scripts/styles; tightening to nonce-based CSP is pending.
- Audit log retention/export is currently in-DB only — no off-cluster shipper.
- TURNSTILE secret is optional in development; production deploys must set it.
