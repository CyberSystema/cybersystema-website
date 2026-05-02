# CyberSystema Web

Edge-native Next.js 16 application deployed to Cloudflare Workers via OpenNext. Powers the public marketing site at [cybersystema.com](https://cybersystema.com) and a hardened administrator control plane under `/admin/**`.

Deployed worker: `cybersystema-web` on `leontg.workers.dev`, fronted by the apex domain.

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js `16.3.0-canary.8` (App Router, Turbopack) |
| UI | React `19.3.0-canary`, Tailwind CSS `4.2.4`, `react-markdown` + `remark-gfm` + `rehype-sanitize` |
| Runtime | Cloudflare Workers (`compatibility_date = 2026-04-29`, `nodejs_compat`) |
| Build | `@opennextjs/cloudflare` `1.19.5`, Wrangler `^4.87.0` |
| Language | TypeScript `6.0.3` |
| Auth | `jose` `6.2.3` (HS256 JWT), Web Crypto (PBKDF2 / AES-GCM / HKDF / HMAC) |
| Validation | `zod` `^4.5.0-canary` |
| Lint | ESLint `^10.3.0` + `eslint-config-next` flat config |
| Storage | Cloudflare D1 (`cybersystema-prod`), KV (`SECURITY_KV`), Assets binding |
| Images | Cloudflare Image Resizing via custom `next/image` loader (`/cdn-cgi/image/...`) |

R2 object storage is intentionally **off**.

## Repository Layout

```
web/
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # Public route group: chrome, dynamic
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx          # /
│  │  │  ├─ about/, contact/
│  │  │  └─ projects/         # /projects, /projects/[slug]
│  │  ├─ admin/               # Chromeless admin SPA
│  │  │  ├─ login/, page.tsx, projects/, contact/, users/, audit/, security/
│  │  ├─ api/
│  │  │  ├─ admin/            # login, logout, mfa, users, projects, contact, audit
│  │  │  └─ contact/          # public contact submission
│  │  ├─ layout.tsx, globals.css, robots.ts, sitemap.ts, favicon.ico
│  ├─ components/
│  └─ lib/
│     ├─ data/                # projects.ts, contact.ts (D1 access)
│     ├─ security/            # session, csrf, totp, password, rate-limit, audit, …
│     └─ client/
├─ db/migrations/             # 0001_init → 0004_project_image
├─ middleware.ts              # Edge: security headers + /admin/** gating
├─ image-loader.ts            # Cloudflare Image Resizing loader
├─ next.config.ts             # CSP, headers, custom image pipeline
├─ wrangler.toml              # Worker bindings
└─ open-next.config.ts        # OpenNext build config
```

## Security Architecture

Defense-in-depth with edge-first enforcement:

- **Edge middleware** ([middleware.ts](middleware.ts)) sets security headers (CSP, HSTS, COOP, CORP, frame-deny, no-store on `/admin/**` and `/api/admin/**`) and short-circuits unauthenticated admin requests.
- **Sessions**: HS256 JWT signed by `ADMIN_SESSION_SECRET`, stored in `__Host-` cookies (Secure, HttpOnly, SameSite=Lax, Path=/). JTI tracked in KV for instant revocation on logout / role change.
- **CSRF**: double-submit cookie + `X-CSRF-Token` header validated by [src/lib/security/csrf.ts](src/lib/security/csrf.ts) on all admin mutations.
- **Passwords**: PBKDF2-SHA256, 100 000 iterations, per-user salt (Web Crypto). See [src/lib/security/password.ts](src/lib/security/password.ts).
- **MFA**: RFC 6238 TOTP (30 s window, ±1 step drift), AES-GCM at-rest encryption of the secret with an HKDF-derived key. Single-use SHA-256 recovery codes. See [src/lib/security/totp.ts](src/lib/security/totp.ts) and [src/lib/security/crypto.ts](src/lib/security/crypto.ts).
- **Rate limiting**: KV token buckets per IP+route (login, MFA, contact). See [src/lib/security/rate-limit.ts](src/lib/security/rate-limit.ts).
- **Lockout** on failed login bursts, with audit trail.
- **IP privacy**: IPs are stored only as HMAC-SHA256 digests ([src/lib/security/ip-hash.ts](src/lib/security/ip-hash.ts)).
- **Audit log**: append-only `audit_logs` table, surfaced at `/admin/audit` (super_admin only).
- **Captcha**: optional Cloudflare Turnstile on `/admin/login` and `/contact`.
- **CSP** in [next.config.ts](next.config.ts) restricts script/style/img/font/connect; `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests`.

There are **no static admin credentials in env**. Admin identities live in D1 (`admin_users`).

## Roles & Surfaces

| Role | Capabilities |
| --- | --- |
| `super_admin` | All content + manage admins + view audit log |
| `content_admin` | Manage projects, manage contact queue |
| `read_only` | Read-only projects + contact |

Public:
- `/` — landing
- `/about`, `/contact` (rate-limited, honeypot + optional Turnstile)
- `/projects`, `/projects/[slug]` — published projects (with optional cover image)

Admin (chromeless layout, `noindex`):
- `/admin` — role-aware dashboard
- `/admin/projects` — projects CRUD with markdown body + cover image (URL + alt)
- `/admin/contact` — submissions queue with status workflow
- `/admin/users` — admin management (super_admin)
- `/admin/audit` — audit log (super_admin)
- `/admin/security` — MFA enrolment + recovery codes

## Local Setup

Requires Node `>=22.12` (developed on `v25.9`) and npm `11+`.

```bash
npm install
cp .env.example .env.local       # set ADMIN_SESSION_SECRET (32+ chars)
npm run db:apply:local           # D1 migrations against local SQLite
npm run seed-admin -- --username admin --password 'a-very-strong-pass' --role super_admin
npm run dev                      # http://localhost:3000
```

> A project-level [`.npmrc`](.npmrc) sets `legacy-peer-deps=true` because the Next.js 16.3 canary peer-requires React `^19.0.0` (stable) while we run a React 19.3 canary build.

For production, seed against remote D1:

```bash
npm run db:apply:remote
npm run seed-admin -- --username admin --password '...' --role super_admin --remote
```

## Scripts

```bash
npm run dev          # next dev (Turbopack)
npm run build        # next build
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
npm run cf:build     # opennextjs-cloudflare build
npm run cf:preview   # local Workers preview
npm run cf:deploy    # production deploy
npm run hash-password
npm run seed-admin
```

## Deployment

```bash
rm -rf .next .open-next
npm run cf:build
CI=1 npx wrangler deploy --config wrangler.toml
```

Smoke check:

```bash
for p in / /about /contact /projects /admin/login; do
  printf "%-15s %s\n" "$p" "$(curl -sS -o /dev/null -w '%{http_code}' https://cybersystema.com$p)"
done
```

### Cloudflare Bindings (see [wrangler.toml](wrangler.toml))

| Binding | Resource |
| --- | --- |
| `DB` | D1 `cybersystema-prod` |
| `SECURITY_KV` | KV namespace (rate-limits + JTI revocations) |
| `ASSETS` | Static assets (`.open-next/assets`) |
| `NODE_ENV` | `"production"` |

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_SESSION_SECRET` | yes | JWT HS256 signing key, AES-GCM HKDF salt, IP HMAC key. **32+ chars.** |
| `TURNSTILE_SECRET_KEY` | no | Server-side Cloudflare Turnstile verification. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | no | Renders the Turnstile widget on `/admin/login` and `/contact`. |
| `CONTACT_NOTIFY_EMAIL` | no | Operational notification target for new contact submissions. |

## Database

D1 schema lives under [db/migrations/](db/migrations):

- `0001_init.sql` — `admin_users`, `projects`, `contact_submissions`, `audit_logs`
- `0002_harden_admin.sql` — MFA, recovery codes, JTI revocation, lockout fields
- `0003_project_pages.sql` — long-form markdown body + metadata
- `0004_project_image.sql` — `image_url`, `image_alt`

Apply with `npm run db:apply:local` or `npm run db:apply:remote`.

## Image Pipeline

`next/image` is wired to a custom loader at [image-loader.ts](image-loader.ts) that emits Cloudflare Image Resizing URLs:

```
/cdn-cgi/image/width=<w>,quality=82,format=auto,fit=scale-down/<src>
```

Width is capped at 1600 px. `data:` and `blob:` URLs pass through. Requires the zone's **Transformations** + **Resize images from any origin** to be enabled.

## Quality Gates

CI-equivalent local checks before deploy:

```bash
npm run lint && npm run typecheck && npm run cf:build
```

## Further Reading

- [SECURITY.md](SECURITY.md) — full security posture, threat model, reporting policy
- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow conventions
- [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) — automation guidance

