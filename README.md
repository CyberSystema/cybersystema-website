# CyberSystema Web (Next.js)

Production-grade Next.js 16 + Cloudflare Workers platform: public site (`/`, `/projects`, `/contact`) plus a hardened administrator control plane (`/admin/**`).

## Highlights

- Next.js 16 App Router (Turbopack), React 19, TypeScript 6
- Cloudflare Workers via `@opennextjs/cloudflare`
- D1-backed admin users, projects, contact submissions, audit log
- Admin auth: PBKDF2-SHA256 passwords, optional **TOTP MFA**, recovery codes, lockout, JTI revocation
- Sessions: HS256 JWT in `__Host-` cookies, double-submit CSRF, KV-backed rate limiting
- AES-GCM at-rest encryption for MFA secrets (HKDF-derived key)
- Per-IP HMAC hashing (no plain-text IPs in DB), Turnstile captcha hooks, audit log
- Edge middleware adds security headers and gates `/admin/**` early

## Local Setup

```bash
npm install
cp .env.example .env.local       # set ADMIN_SESSION_SECRET (32+ chars)
npm run db:apply:local           # apply D1 migrations to local SQLite
npm run seed-admin -- --username admin --password 'a-very-strong-pass' --role super_admin
npm run dev                      # http://localhost:3000
```

For production, repeat seeding against the remote D1:

```bash
npm run db:apply:remote
npm run seed-admin -- --username admin --password '...' --role super_admin --remote
```

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run build
npm run cf:build
```

## Cloudflare Workflow

```bash
npm run cf:build      # OpenNext bundle
npm run cf:preview    # local Workers preview
npm run cf:deploy     # production deploy
```

Bindings configured in `wrangler.toml`:
- `DB` — D1 database (admin_users, projects, contact_submissions, audit_logs, …)
- `SECURITY_KV` — KV namespace for rate-limit buckets and JTI revocations
- `ASSETS` — static assets

R2 is intentionally disabled.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_SESSION_SECRET` | yes | JWT HS256 signing, AES-GCM HKDF, IP HMAC. 32+ chars. |
| `TURNSTILE_SECRET_KEY` | no | Server-side Turnstile verification. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | no | Renders the Turnstile widget on login + contact. |
| `CONTACT_NOTIFY_EMAIL` | no | Operational notification target for contact submissions. |

There are **no** static admin credentials in env — admin users live in D1.

## Admin Roles

- `super_admin` — full access, can manage other admins, view audit log
- `content_admin` — manage projects + contact queue
- `read_only` — read-only views of projects + contact

## Admin Surfaces

- `/admin` — dashboard with role-aware nav + counts
- `/admin/projects` — projects CRUD
- `/admin/contact` — submissions queue + status workflow
- `/admin/users` — admin user management (super_admin only)
- `/admin/audit` — append-only audit log (super_admin only)
- `/admin/security` — per-user MFA enrolment + recovery codes

## Public Surfaces

- `/` — landing page
- `/projects` and `/projects/[slug]` — published projects
- `/contact` — contact form (rate-limited, honeypot + optional Turnstile)

## Security

See `SECURITY.md` for the full posture summary, threat model, and reporting policy.

