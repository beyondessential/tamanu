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
- Backfill row updates pause auditing rather than writing a near-duplicate
  entry per moved row; the changelog rewrite itself targets `logs.changes`,
  which carries no triggers.
- Facility store seeding relies on hash convergence (same bytes, same hash),
  so no coordination with central's progress is needed.

## Dependency: the `hash` column

J2/K2 own routing attachments and assets through the store and were to add the
`hash` column, but neither has landed. The backfill cannot exist without the
column, so this card adds it (DDL migration + model fields). J2/K2 rebase onto
it rather than adding it themselves.

Facility-side attachment rows are deliberately left alone: they push their
bytes inline through sync today, and the outbox that replaces that is G2. The
backfill seeds the facility store and moves changelog entries only.

## Memory

Rows can be far larger than a batch's worth of RAM, so bytea moves in and out
of Postgres in chunks (`substring(... from ... for ...)`), never as one value.
Bounded regardless of blob size, not just regardless of volume.

## Checklist

- [ ] DDL migration: `hash` on attachments and assets, `data` nullable, index
- [ ] Model fields for `hash` on Attachment and Asset
- [ ] Chunked bytea read/write helpers
- [ ] Backfill engine: reference rows, changelog entries, remaining counts
- [ ] Store factory from settings (root + free-disk reserve)
- [ ] Scheduled task on central and facility, with settings
- [ ] Rollback sub-command
- [ ] dbt source models regenerated
- [ ] Unit and integration tests
- [ ] Lint and test run
