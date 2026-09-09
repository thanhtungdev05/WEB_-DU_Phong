---
name: postgres-migration-safety
description: Use for PostgreSQL/Neon schema changes, custom SQL migrations, migration ledger/checksums, advisory locking, data migrations, shared PHP/Django schema changes, or bulk data updates.
---

# PostgreSQL migration safety

1. Use the repository's custom migration system under `api/migrations`.
2. Preserve checksum/ledger expectations.
3. Treat migrations as forward-only unless the project explicitly supports rollback.
4. Use advisory locking and transaction patterns already established by the migration runner.
5. Distinguish schema migration from data migration.
6. Check compatibility with both PHP queries and Django `managed=False` models.
7. Never test destructive migrations against shared/production Neon.
8. Define affected rows before bulk changes.
9. Preserve referential integrity and identifiers.
10. Report irreversible or high-risk effects explicitly.
