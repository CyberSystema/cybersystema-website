# Database Baseline (D1)

This folder contains Cloudflare D1 migration assets for CyberSystema.

## Migration Order

1. `migrations/0001_init.sql`

## Usage

Apply via Wrangler once D1 is provisioned:

```bash
wrangler d1 migrations apply cybersystema-prod
```

For local simulation:

```bash
wrangler d1 execute cybersystema-prod --local --file ./db/migrations/0001_init.sql
```

## Security Notes

- Never store plaintext admin passwords in `admin_users.password_hash`.
- Hash source IPs before inserting into audit/contact tables.
- Log all admin-auth and content mutations into `audit_logs`.
