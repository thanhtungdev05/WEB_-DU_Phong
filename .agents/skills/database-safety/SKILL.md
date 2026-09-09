---
name: database-safety
description: Use for schema changes, migrations, ORM queries, imports/exports, bulk updates, data cleanup, or any FPT web task that can alter persisted data.
---

# Database safety workflow

1. Identify database engine and migration mechanism from the repository.
2. Inspect existing schema/model and dependent code.
3. Distinguish schema migration from data migration.
4. Avoid destructive changes unless explicitly required and safely migrated.
5. Make migrations reversible where practical.
6. For bulk updates, define the affected rows before writing.
7. Use transactions when partial completion would corrupt state.
8. Preserve identifiers and referential integrity.
9. Do not expose private data in logs or debug output.
10. Test migration/rollback or at least validate migration generation and affected queries before deployment.
