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

## Current Known Hardening Gaps

These are planned improvements, not unknown vulnerabilities:

- Admin auth is currently environment-backed and should move to hashed D1-backed credentials.
- Login throttling is currently in-memory and should move to Cloudflare KV.
- Turnstile is not yet enforced on login or contact workflows.
- MFA is not yet implemented.
