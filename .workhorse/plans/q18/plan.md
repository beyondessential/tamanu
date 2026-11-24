# Make created_at NOT NULL on changelog-logged tables

## Build steps

- [x] Recompute the in-scope table list from a freshly migrated database (query in the card description)
- [x] DML migration: backfill NULL `created_at` / `updated_at` on every in-scope table, same shape as `1784843046612-backfillNullCreatedUpdatedAtTimestamps.ts`
- [x] DDL migration: `SET NOT NULL` on `created_at` and `updated_at` for every in-scope table
- [x] Migration test in `packages/database/__tests__/migrations/`: seed NULL rows from the pre-migration state, run up, check values and constraints, run down
- [x] Schema test: every changelog-logged table has NOT NULL `created_at` and `updated_at`
- [x] Facility test: registry add for a patient with an existing `patient_facilities` row
- [x] Regenerate `database/model/` (`dbt-generate-model`, `dbt-check-todos`)
- [x] Add `socket_io_attachments` to `NON_LOGGED_TABLES` and drop its changelog trigger
- [x] Schema test: no table in `NON_LOGGED_TABLES` carries a changelog trigger
- [x] Lint

## Notes

- **Scope is both timestamps.** `logs.changes.record_updated_at` is NOT NULL too, and `set_updated_at` leaves an explicitly inserted NULL alone, so a NULL `updated_at` breaks updates the same way. The 21 tables from the card get both columns tightened; the 8 `invoice_*` tables whose `updated_at` was still nullable (their `created_at` already wasn't) get `updated_at`.
- **`socket_io_attachments` is no longer logged.** It has no `updated_at` or `deleted_at`, so `logs.record_change()` failed every write to it, including the oversized broadcast payloads central's `@socket.io/postgres-adapter` writes there. It is in `NON_LOGGED_TABLES` now, and a migration drops its existing trigger, since the post-migration hook only ever adds them. Its `created_at` stays nullable: nothing reads it into the changelog any more.
- **One scan per table.** Both `SET NOT NULL`s go in one `ALTER TABLE`, so each table is validated in a single scan. No `CHECK ... NOT VALID` dance: migrations run in downtime.
- **Backward compatible.** Nothing in earlier releases writes an explicit NULL: Sequelize fills both timestamps (sync's `bulkCreate` included, which receives records without them), and the one raw insert (`onCreateEncounterMarkPatientForSync`) leaves them to the column default. So no `BACKWARD INCOMPATIBLE` marker.
- **Release notes.** Data-migration tooling or manual SQL inserting an explicit NULL timestamp into these tables now fails.
