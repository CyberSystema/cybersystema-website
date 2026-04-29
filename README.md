# CyberSystema Web (Next.js)

Production migration target for CyberSystema public website and secure administrator control plane.

## Current Baseline

- Next.js App Router with TypeScript
- CyberSystema-branded public landing page
- Hardened security headers via Next.js config (`next.config.ts`)
- Admin login flow (`/admin/login`) with:
	- strict input validation (`zod`)
	- rate limiting (in-memory placeholder)
	- signed HttpOnly secure session token (`jose`)
- Admin dashboard guard (`/admin`)
- Cloudflare deployment scaffolding (`wrangler.toml`)
- D1 schema baseline (`db/migrations/0001_init.sql`)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set secure values:

```bash
cp .env.example .env.local
```

3. Run development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run build
```

## Cloudflare Workflow

Build and deploy workflow is prepared for OpenNext + Workers:

```bash
npm run cf:build
npm run cf:preview
npm run cf:deploy
```

Before deployment, update `wrangler.toml` bindings for D1/KV and configure secrets in Cloudflare.
R2 is disabled by default in this repository for near-zero cost operation.

## Public Repository Baseline

This repository is prepared for public GitHub hosting.

- Local secret files remain ignored while `.env.example` stays committed.
- CI verifies lint, typecheck, and production build on pushes and pull requests.
- CodeQL is enabled for automated static analysis.
- Dependabot is configured for dependency and GitHub Actions updates.
- Production deploys are handled by Cloudflare Git-linked Worker builds.
- Security reporting guidance lives in `SECURITY.md`.
- Contribution expectations live in `CONTRIBUTING.md`.

## Automatic Deployment via Cloudflare

This project uses Cloudflare Git-linked deployment as the single production deploy path.

Recommended Cloudflare Worker build settings:

1. Root directory: `/web`
2. Build command: `npm ci && npm run cf:build`
3. Deploy command: `npx wrangler deploy --config wrangler.toml`

Keep GitHub Actions CI (`ci.yml`) for quality checks only.

## Security Notes

- Do not keep plaintext `ADMIN_PASSWORD` long-term.
- Next phase should move admin auth to salted password hash storage in D1 and add MFA.
- Current login rate limiter is process-local; replace with Cloudflare KV-based distributed limiter.
- Add Turnstile verification to admin login and contact form before production launch.

## Cost Control Notes

- Default mode is optimized for minimal Cloudflare spend.
- R2 object storage is intentionally not bound by default.
- OpenNext R2 incremental cache is intentionally disabled.
- Enable R2 only for specific features that require file/object storage.

## Next Implementation Targets

1. D1-backed admin users and projects CRUD
2. Contact pipeline with Turnstile + transactional email provider
3. KV-backed global rate limiting and lockouts
4. Audit logging for all privileged actions
5. CI pipeline with dependency and secret scanning
