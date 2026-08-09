# Blob integrity scrub and self-heal — test cases

Scenarios that verify the store detects corruption on every path the spec names,
grades it by whether the copy is authoritative, and repairs it where it can.

Automated coverage lives in `packages/database/__tests__/blobStore/`,
`packages/facility-server/__tests__/blobIntegrity/`, and the quarantine block of
`packages/central-server/__tests__/blobTransfer.test.js`.

## Verification

- [x] A whole-blob read of content whose stored bytes no longer match its hash
  fails rather than serving the bytes as complete (verifies spec: SCRUB)
- [x] A whole-blob read of intact content succeeds and reports no fault
- [x] A ranged read of corrupt content is not failed, since part of a blob cannot
  be checked against a hash of the whole (verifies spec: SCRUB)
- [x] Corruption found on the read path runs the same self-heal as the scrub
- [x] Content received over the transfer channel is verified before it is stored
  (covered by F2's channel tests, which this card leaves intact)

## Scrub

- [x] A scheduled pass verifies stored blobs and records when each was checked
- [x] Never-scrubbed blobs are taken ahead of ones scrubbed long ago
- [x] A pass stops on its blob-count limit and on its byte limit
- [x] Successive passes cover the whole store
- [x] An already-quarantined blob is not re-reported on every pass
- [x] A blob the healer cannot repair does not stop the rest of the pass
- [x] A blob quarantined on the read path mid-pass stays quarantined when the
  end-of-pass verified batch flushes, so known-bad bytes are never re-served
  (verifies spec: SCRUB)
- [ ] A scrub pass on a store of realistic size stays within its byte budget and
  does not starve clinical IO — needs a volume test, not a unit test

## Registry reconciliation

- [x] Bytes on disk that no registry entry names are verified and registered
- [x] Bytes whose content does not match the hash their location encodes are
  quarantined rather than adopted as good content
- [x] Content left by an admission interrupted between placing the file and
  recording it is recovered on the next pass
- [x] A registry entry naming bytes the store does not hold is recorded absent
- [ ] A server restored from a backup whose store and database were captured at
  different moments converges after a scrub cycle (verifies spec: SCRUB) — needs
  a restore fixture spanning both captures

## Severity grading

- [x] A corrupt facility cache copy is dropped so the next read refetches it
- [x] A corrupt facility outbox blob is quarantined, not dropped, since it may be
  the only copy (verifies spec: SCRUB)
- [x] A facility outbox blob whose bytes have gone is recorded absent
- [x] An outbox blob is repaired from central where central turns out to hold it,
  and demotes to cache once it is
- [x] An outbox blob central cannot supply stays quarantined and is escalated
- [x] Quarantined bytes are retained on disk, not deleted

## Central peer healing

- [x] An offer for a hash whose held copy is quarantined is wanted, not declined
- [x] A pushed replacement that verifies replaces the quarantined copy, and the
  blob serves again
- [x] An offer for content central holds and has no fault with is still declined
- [x] A quarantined blob is never served, and the channel does not disclose the
  quarantine
- [x] An absent blob is withheld the same way: not held on availability and fetch,
  wanted on offer (verifies spec: BLAC, SCRUB)

## Referential integrity

- [x] Hashes reported as undeliverable by the server are raised as faults
- [x] The pass is skipped where a server supplies no reference check
- [x] A reference whose record synced longer ago than the delivery grace, with no
  bytes held, is reported (verifies spec: SCRUB) — covered against a scratch
  reference source; a real consumer source arrives with J2 or K2
- [x] A reference still within the delivery grace is treated as content-pending
  rather than reported

## Operations

- [ ] The `blob_integrity` Canopy check reads the documented queries and reports
  the states they distinguish — Canopy-side, outside this repo
- [ ] The runbook's outbox-restore path works end to end: a blob placed in its
  fan-out path by hand is adopted by the next scrub pass
