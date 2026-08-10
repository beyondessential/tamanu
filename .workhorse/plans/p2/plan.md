# Blob integrity scrub and self-heal

Implements `specs/blob-storage/integrity.md` (SCRUB) over the store primitive (E2),
the transfer channel (F2), access control (H2) and the facility cache tiers (G2),
all of which are already merged into the epic branch.

## Shape

Detection and repair are separated. A `BlobScrubber` in the database package owns
detection — it is the same on every server — and is handed a `heal` policy by the
server that constructs it, because what a fault means and how it is repaired
differ between central and a facility. The scrubber never decides severity.

Three passes make up one scrub:

- **Verification** walks the registry least-recently-scrubbed first, re-hashes each
  blob, and stamps `last_scrubbed_at`.
- **Reconciliation** walks the store's own fan-out directories to find bytes no
  registry entry names.
- **Referential integrity** asks the server for content that must be durably
  present but is not held.

Rate limiting is per pass, by blob count and byte volume, so a pass on a large
store is bounded and the target cycle is met across many passes rather than one.

## Registry state

`integrity_state` gains `absent`, so a registry row naming bytes the store does not
hold is distinguishable from a corrupt one. Scrub time is a new
`last_scrubbed_at` column; the scrub *result* is the integrity state as of that
time, so no second column is needed.

## Severity grading

The tier column already carries the distinction the spec grades on, so the healer
reads it rather than inferring anything:

- Facility, `cache`, corrupt: delete the blob so the next read refetches it. Low
  severity, self-correcting, logged at warn.
- Facility, `cache`, missing: not a fault. Evicted content is expected to be absent.
- Facility, `outbox`: the only durable copy. Quarantine or mark absent, escalate,
  and try central as a peer (it may hold content whose demotion was interrupted).
- Central: every copy is authoritative. Quarantine or mark absent, escalate. Peer
  repair is opportunistic rather than driven from here.

## Opportunistic peer healing on central

Central cannot reach a facility on demand, so healing happens on the connection a
facility already makes. The offer route answers `wanted` rather than
`already-stored` when the copy it holds is quarantined, and a commit over a
quarantined copy replaces it. This needs no index of what facilities hold, which
the spec explicitly rules out.

## Referential integrity and the consumer cards

The central referential check runs over the blob reference sources registered in
`blobReferences.js`. That list is empty until J2 (attachments) and K2 (assets)
land, so the check is wired and tested but finds nothing today. The facility side
is complete now, since an outbox row with missing bytes is found by the
verification pass.

## Deferred

Error correction is the first rung of the ladder but belongs to R2; the healer
leaves the seam for it rather than stubbing a hook that does nothing. Bao-style
per-range verification stays deferred, and the ranged-read carve-out in the spec
is what makes that acceptable.

## Review follow-ups

Triage of a stashed reviewer finder-pass (2026-08-10, unverified findings from a
cancelled review):

- **Fixed — scrub flush un-quarantine race.** `recordVerified` batch-stamped
  VERIFIED with no state guard, so a read-path quarantine landing between a blob's
  verify() and the end-of-pass flush was overwritten and the known-bad bytes served
  again until the next pass. Now guarded with `integrityState != quarantined`, the
  same guard `commitStaged` already uses. Regression test added.
- **Confirmed, deferred — rollback halted by one corrupt blob.** In the M2 backfill,
  `rollbackReferenceRows`/`rollbackChangelogEntries` read through the verifying
  `get()` stream; a single `BlobHashMismatchError` throws out of the batch loop, and
  because batches are `ORDER BY id` the corrupt row sits at the front of every rerun,
  so rows after it never restore. Real data-loss, but in the rollback subcommand
  (dev-OTS, rare) and the right fix needs a product decision on what rollback does
  with a corrupt blob (skip-and-report vs abort). Belongs to M2, not this card.
- **Ruled out — ranged reads serving corrupt bytes.** `get()` refuses any
  quarantined blob up front regardless of range; ranged reads skip only the re-hash,
  which is the documented carve-out. Not a bug.

## Steps

- [x] Add the `absent` integrity state and scrub tuning constants
- [x] Migration for `blobs.last_scrubbed_at` and dbt models. No mobile counterpart:
  a device runs no scrub (see `facility-cache.md` via L2), so the column would be dead there
- [x] `BlobStore.verify()` and full-read verification on the serving path
- [x] `BlobStore` store walk for reconciliation, and replacement of a quarantined copy
- [x] `BlobScrubber` with the three passes and rate limiting
- [x] Facility healer, scrub task, and settings
- [x] Central healer, scrub task, settings, and opportunistic peer healing
- [x] Runbook, healthcheck map entry, and query cookbook entries
- [x] Tests across store, scrubber, and both servers
