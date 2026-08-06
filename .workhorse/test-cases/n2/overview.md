# Blob store backups and restore

The behaviour is implemented in bestool, so most of these are manual scenarios run
against a test deployment rather than automated Tamanu tests. The registry
reconciliation is the exception and is automatable in the Tamanu codebase, on
whichever card implements it.

## Backup ordering

- [ ] A cycle's store capture contains every blob the database capture references
  (verifies spec: BKUP)
- [ ] A blob admitted between the database capture and the store capture is present
  in the store capture and unreferenced by the database capture, and restores as a
  harmless orphan (verifies spec: BKUP)
- [ ] A store capture taken while blobs are being admitted contains no partial or
  corrupt blob, every captured blob verifying against its hash (verifies spec: BKUP)
- [ ] The database and store captures of one cycle can be identified as a pair
  after the fact, without relying on an operator comparing timestamps by eye
  (verifies spec: BKUP)

## Incremental backup

- [ ] A second cycle over an unchanged store transfers no blob bytes (verifies
  spec: BKUP)
- [ ] A second cycle transfers only the blobs added since the first (verifies spec:
  BKUP)
- [ ] The most recent store capture restores on its own, with no earlier capture
  available, and yields every blob present in the store when it was taken (verifies
  spec: BKUP)
- [ ] A blob added many cycles ago and never touched since is still recoverable
  from the most recent cycle (verifies spec: BKUP)

## Facility backups

- [ ] A facility backup captures both store tiers, an outbox blob and a cache blob
  both surviving the round trip (verifies spec: BKUP)
- [ ] A restored facility serves a blob that was in its cache before the backup
  without fetching it from central first (verifies spec: BKUP)
- [ ] A facility restored from backup reproduces the original's store contents
  rather than a subset refetched from central (verifies spec: BKUP)

## Restore

- [ ] Restoring database and store from one cycle leaves no reference without its
  bytes (verifies spec: BKUP)
- [ ] A later store capture restored against an earlier database capture leaves no
  reference without its bytes (verifies spec: BKUP)
- [ ] An earlier store capture is refused against a later database capture
  (verifies spec: BKUP)
- [ ] A blob on disk with no registry row after a restore is registered and becomes
  servable (verifies spec: BKUP)
- [ ] A registry row whose bytes are missing after a restore is recorded as absent,
  and the server does not report holding the blob (verifies spec: BKUP)
- [ ] A restored facility reference whose bytes are absent is surfaced as
  content-pending rather than as an error, and resolves once fetched from central
  (verifies spec: BKUP)
- [ ] A restored central reference whose bytes are absent is escalated rather than
  left content-pending (verifies spec: BKUP)
- [ ] A restored facility outbox drains to central, and blobs the original had not
  delivered arrive after the restore (verifies spec: BKUP)
- [ ] An orphan blob restored onto central is reclaimed by orphan collection; the
  same blob restored onto a facility is treated as cache and evicted under the
  budget (verifies spec: BKUP)

## Runbook and cookbook

- [ ] The store size by tier query runs on a facility server and on central, and
  its figures match what is on disk under the configured store root
- [ ] The outbox depth query distinguishes a blob not yet eligible to push from one
  that is eligible and stuck
- [ ] The quarantined blobs query returns nothing on a healthy server
- [ ] A support officer following the runbook can tell a store restored to the
  wrong path from a store that was not restored at all
- [ ] A support officer following the runbook can distinguish a content-pending
  count that is falling from one that is stuck
- [ ] The runbook's escalation cases (an outbox blob missing from the restored
  store, a persisting corruption report) are reachable from what the officer can
  actually observe
