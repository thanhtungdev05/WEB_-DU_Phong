# Controlled database cutover

The application uses exactly one writable database tier at a time:

```env
DATABASE_ACTIVE=primary
# DATABASE_ACTIVE=fallback
```

PHP API, Django Admin, and `db_guardian.py` all use this value. A connection
failure does not switch tiers automatically, and recovery of the primary does
not switch traffic back automatically. This prevents split-brain writes.

## Before cutover

1. Confirm both `DATABASE_URL` and `FALLBACK_DATABASE_URL` are configured in
   the deployment environment. Never commit either value.
2. Put user-facing writes into a maintenance window and record its start time.
3. Create the target from a complete dump/restore. Use
   `scripts/neon_failback.ps1` with explicit source and target connection
   strings; do not use `sync_fallback_db` as proof of a complete copy.
4. Compare the migration ledger and row counts for at least `users`,
   `timer_sessions`, `training_classes`, `class_enrollments`,
   `lab_assignments`, `app_sessions`, and Django session/auth tables.
5. Verify sequences are greater than the maximum identifier in their tables.
6. Test login, IAM callback, starting/submitting a lab, dashboard, and Django
   Admin against the target.

## Cutover

1. Keep writes paused.
2. Complete the final dump/restore or wait for replication lag to reach zero.
3. Change `DATABASE_ACTIVE` to the target tier and restart/deploy the service.
4. Confirm `/api/system/usage` reports the expected `activeTier`.
5. Run one controlled write and verify it exists only on the selected tier.
6. Re-enable user writes.

## Rollback and failback

- Do not allow both tiers to accept application writes.
- Keep the old tier unchanged until the validation window ends.
- To return, repeat the same process in the opposite direction. Copy the
  current active database into the target before changing `DATABASE_ACTIVE`.
- Do not switch merely because a previously unavailable database reconnects.

For the current small database, announce a five-minute maintenance window and
target a sub-minute application cutover after rehearsal. Measure the actual
dump, restore, deployment, and smoke-test durations before making an SLA.
