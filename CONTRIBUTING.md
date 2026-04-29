# Contributing

## Development Baseline

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in local-only values.
3. Run `npm run dev` for local development.
4. Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

## Security Requirements

- Do not commit secrets, Cloudflare tokens, or local environment files.
- Do not weaken auth, rate limits, validation, or proxy headers without documenting the tradeoff.
- Prefer secure defaults over convenience for admin-facing features.
- Any new mutation route must include validation and authorization checks.

## Pull Requests

Pull requests should include:

- a short summary of the change
- risk notes for auth, security, or infrastructure changes
- validation steps performed locally

## Scope Discipline

Keep changes focused. Avoid mixing UI work, schema work, and infrastructure changes in one pull request unless they are tightly coupled.
