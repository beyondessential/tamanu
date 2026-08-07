# Backfill migration test cases

Covers moving legacy in-database attachment and asset content onto the
filesystem, the changelog rewrite, and rollback. Ticked cases are covered by
automated tests in `packages/central-server/__tests__/blobBackfill.test.js`,
`packages/central-server/__tests__/blobBackfillTask.test.js`, and
`packages/database/__tests__/blobStore/byteaChunks.test.ts`.

## Moving reference rows

- [x] An attachment's bytes land in the store and its row swaps to the hash (verifies spec: BKFL)
- [x] An asset moves the same way (verifies spec: BKFL)
- [x] Two rows with identical content share one stored blob (verifies spec: CAS)
- [x] Zero-byte content moves like any other (verifies spec: CAS)
- [x] Content larger than one read slice moves intact (verifies spec: BKFL)
- [x] A batch stops at its size and the next run takes the rest (verifies spec: BKFL)
- [x] An already-moved row is left alone (verifies spec: BKFL)
- [x] A run interrupted between store admission and the row update resumes without duplicating content (verifies spec: BKFL)
- [x] Moving a row writes no changelog entry of its own (verifies spec: BKFL)
- [x] Admission refuses rather than crossing the free-disk reserve, leaving the row untouched (verifies spec: CAP)
- [ ] A row whose content is many gigabytes moves without the process growing (manual, needs a large fixture)

## Facility seeding

- [x] Seeding admits content and leaves the rows untouched (verifies spec: BKFL)
- [x] Seeding walks pending rows by offset so a run terminates (verifies spec: BKFL)
- [x] The facility ends up holding content under the hash central will send (verifies spec: BKFL)
- [ ] An updated asset row arriving from central resolves against the seeded blob with no refetch (needs the asset read path, K2)
- [ ] An asset whose bytes were not seeded before its updated row arrives is content-pending and fetches on demand (needs the asset read path, K2)
- [ ] An attachment awaiting upload at upgrade becomes an outbox blob and pushes (G2 landed the outbox, but `putOutbox` has no consumer until the attachment write path lands in J2)

## Changelog entries

- [x] An entry's bytes are replaced by the hash and the content is kept (verifies spec: BKFL)
- [x] Content surviving only in the changelog, such as a superseded asset, is preserved (verifies spec: BKFL)
- [x] Rewriting is idempotent across runs (verifies spec: BKFL)
- [x] Entries for other tables are untouched (verifies spec: BKFL)
- [ ] Two servers rewriting their own copies of an entry converge on the same content (needs a two-server harness)

## Progress and completion

- [x] Remaining rows and entries are reported and fall to zero (verifies spec: BKFL)
- [x] Completion confirms every referenced hash is backed by held content (verifies spec: BKFL)
- [x] A hash whose content is missing is named rather than reported complete (verifies spec: BKFL)
- [x] The queue reads as empty once everything has moved (verifies spec: BKFL)
- [x] A deployment with no legacy content does nothing (verifies spec: BKFL)

## The scheduled job

- [x] The store is built at the root the setting points to (verifies spec: BKFL)
- [x] One run drains every table and the changelog (verifies spec: BKFL)
- [x] More rows than one batch holds are all worked through (verifies spec: BKFL)
- [x] A run cut short is picked up by the next (verifies spec: BKFL)
- [x] Reaching the free-disk reserve pauses the run instead of failing it (verifies spec: BKFL)
- [ ] The job starts on its own after an upgrade with no operator action (manual, on a deployment)
- [ ] Batch size and pause changed in settings apply on restart (manual)

## Reads during the backfill

- [ ] A row still holding bytes serves from the database column (needs the read path, J2/K2)
- [ ] A backfilled row serves from the store (needs the read path, J2/K2)
- [ ] Both forms are indistinguishable to the requester (needs the read path, J2/K2)

## Rollback

- [x] A moved row's bytes go back and its hash is dropped (verifies spec: BKFL)
- [x] Content larger than one write slice is restored intact (verifies spec: BKFL)
- [x] A changelog entry's byte snapshot is restored (verifies spec: BKFL)
- [x] A partially completed backfill reverses cleanly (verifies spec: BKFL)
- [x] Content round-trips byte-for-byte through backfill and rollback (verifies spec: BKFL)
- [ ] Rollback against a store missing content reports rather than corrupting rows

## Operational

- [ ] Clearing the byte columns leaves the database file size unchanged until a rewrite, and this is documented for operators
