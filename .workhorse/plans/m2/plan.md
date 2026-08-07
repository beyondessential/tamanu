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

## Memory and per-blob size

A single blob is handled whole, not in slices. Attachment content is capped at
`DOCUMENT_SIZE_LIMIT` (10MB) and assets are small logos, and the rest of the
system already loads them whole, so a whole-value read or write is bounded and
in keeping with existing patterns. The "hundreds of gigabytes" is aggregate
across rows, which batching bounds by working one row at a time.

Slicing a bytea in SQL would have been actively worse: `substring` over a
`decode(...)` expression, and `data = data || chunk` appends, both re-materialise
the whole value per slice, so a large blob would be quadratic in CPU and write
amplification. An earlier chunked helper did exactly this and was removed.

## Checklist

- [x] DDL migration: `hash` on attachments and assets, `data` nullable, index
- [x] Model fields for `hash` on Attachment and Asset, plus null-tolerant sync
      sanitizers so a backfilled asset still syncs
- [x] Chunked bytea read/write helpers
- [x] Backfill engine: reference rows, changelog entries, remaining counts,
      unbacked-hash check, rollback both ways
- [x] Uses the server's own `context.blobStore` rather than building one
- [x] Scheduled task on central and facility, with settings
- [x] Rollback sub-command
- [x] dbt source models updated by hand, `dbt-check-todos` clean
- [x] Unit and integration tests
- [x] Lint clean on every changed file

## Server discrimination

The task runs on both servers and behaves differently on each, so it reads
`serviceContext().serverType` (backed by `global.serverInfo.serverType`, set at
boot in each server package) — the same signal `SendStatusToMetaServer` uses.
Central owns the rows: it holds attachment and asset bytes and rewrites the rows
in place, covering both tables. A facility holds only pulled asset bytes, so it
seeds its store for `assets` alone and leaves the rows for central's synced
updates; facility attachments push inline and belong to the outbox (G2/J2), not
this backfill. The per-server table set is threaded into `BlobBackfill` at
construction so counting, changelog rewrite, and completion all scope to it.

Mobile needs no migration here: it has no `assets` table, and its attachments
are push-only (`PUSH_TO_CENTRAL`), so a backfilled hash-only row never reaches
it. Mobile's own blob transition is card L2.

## Taking the store from the context

F2/G2/H2 landed a `context.blobStore` on both servers, so the backfill uses that
rather than constructing its own. This matters on a facility: the server's store
carries the cache-eviction hook, so an admission that runs the volume down to
the reserve evicts cache instead of refusing. A second store built from the same
settings would have refused. The standalone rollback command still builds one,
since it runs with no server started.

Central admissions take the default `cache` tier. Nothing on central reads the
tier (there is no eviction there, and no `evictCache` hook), so it is inert.
Facility seeding wants `cache` anyway: pulled asset content is evictable and
refetchable.

## Environment notes for whoever picks this up

- A `DATABASE_URL` env var overrides `config/test.json5` through
  `resolveDbConfig`. With one set to a dead address every central test dies with
  `read ECONNRESET`, including untouched suites.
- `packages/database` vitest does not set `NODE_CONFIG_DIR`, so 13 test files
  that transitively import `sync/saveChanges` fail at import on
  `config.sync.persistUpdateWorkerPoolSize`. Pre-existing.
- Central suites currently time out in `afterAll` on `ctx.close()`, untouched
  suites included, so a suite reports failed even when every test passes.
