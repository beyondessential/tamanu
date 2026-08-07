# Backfill migration

## Tech notes

- Clearing bytea does not shrink the database files: space is reclaimed for
  reuse by autovacuum but the on-disk size only drops with a rewrite
  (`VACUUM FULL`/`pg_repack`), which is an operator decision, not part of the
  job. Worth a line in the upgrade/ops docs when implementing.
- No FHIR rematerialisation storm: `Attachment` is not a FHIR upstream
  (`LabRequestAttachment` is, and the backfill does not touch it).
- No sync storm from attachments: `PUSH_TO_CENTRAL_THEN_DELETE`, so
  central-side row updates do not sync down. Asset row updates do sync
  everywhere, but assets are few; that re-sync is how facilities and mobile
  receive the hash.
- Backfill row updates write ordinary migration-context changelog entries
  (post-backfill rows are small, so the entries are too). The changelog
  rewrite itself targets `logs.changes`, which carries no triggers.
- Facility store seeding relies on hash convergence (same bytes, same hash),
  so no coordination with central's progress is needed.
