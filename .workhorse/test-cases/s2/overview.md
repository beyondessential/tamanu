# Sans-io blob package — test cases

Scenarios for the extracted package. Nothing is ticked: the extraction happens after
L2, so this is the coverage the card owes rather than coverage that exists.

The point of the extraction is that one implementation of the state machines serves
both hosts, so the tests split three ways: package tests that drive the state
machines against a fake host and never touch a filesystem or a network, contract
tests that every host implementation must pass, and the existing server suites
re-pointed at the package to prove the extraction changed no behaviour.

## Package tests against a fake host

The fake host records the port calls it received and returns scripted results, so
each case asserts on the sequence of decisions rather than on bytes moved.

### Fetch state machine

- [x] A fetch of unheld content requests from offset zero and commits once the total arrives (verifies spec: XFER)
- [x] An interrupted fetch resumes from the host's reported staged size, not from zero (verifies spec: XFER)
- [x] Staged bytes already covering the known size commit without a further request (verifies spec: XFER)
- [x] A total size learned from a previous response is not re-probed on the next pass (verifies spec: XFER)
- [x] An attempt delivering new bytes resets the stalled counter (verifies spec: XFER)
- [x] Consecutive attempts delivering no new bytes give up after the configured limit (verifies spec: XFER)
- [x] A body that ends early without erroring is retried with the same backoff as an error (verifies spec: XFER)
- [x] Content the host already holds skips the transfer entirely (verifies spec: XFER)
- [x] A not-found from the source is terminal, not retried (verifies spec: XFER)
- [x] Backoff grows with consecutive stalled attempts (verifies spec: XFER)

### Push state machine

- [x] An offer answered already-stored acknowledges without moving bytes (verifies spec: XFER)
- [x] An offer answered wanted pushes from the receiver's reported staged count (verifies spec: XFER)
- [x] Chunk boundaries follow the host-supplied chunk size, not a package constant (verifies spec: XFER)
- [x] A failed chunk re-offers to relearn the receiver's position and resumes from it (verifies spec: XFER)
- [x] A re-offer that itself fails counts as a stalled attempt and preserves the original error (verifies spec: XFER)
- [x] A hash mismatch from the receiver is terminal, not retried (verifies spec: XFER)
- [x] A refusal from the receiver is terminal, so the pusher moves to the next blob (verifies spec: BLAC)
- [x] A zero-byte blob completes with one empty delivery (verifies spec: CAS)
- [x] Every byte delivered without an acknowledgement is an error, not a silent success (verifies spec: XFER)
- [x] A push of content the host does not hold fails rather than offering it (verifies spec: XFER)

### Availability

- [x] Bytes held locally report available (verifies spec: XFER)
- [x] Bytes the source holds but the host does not report awaiting-fetch (verifies spec: XFER)
- [x] Bytes neither holds report awaiting-upload (verifies spec: XFER)

### Outbox pusher policy

- [x] Eligible blobs are offered oldest-first (verifies spec: CACHE)
- [x] An ineligible blob is skipped without being offered (verifies spec: CACHE)
- [x] A blob already in flight is not offered again (verifies spec: CACHE)
- [x] A failed push does not block the blobs behind it (verifies spec: CACHE)
- [x] An acknowledged blob is demoted to cache (verifies spec: CACHE)
- [x] A push acknowledged but not demoted is re-demoted on a later pass (verifies spec: CACHE)
- [x] A failing reference resolver does not starve other consumers of eligibility (verifies spec: CACHE)
- [x] No registered resolvers means nothing is eligible (verifies spec: CACHE)
- [x] A push that returns without an acknowledgement is left in the outbox, not demoted (verifies spec: CACHE)
- [x] An empty outbox asks no resolver (verifies spec: CACHE)

### Eviction policy

- [x] Cache over budget evicts least-recently-used first (verifies spec: CACHE)
- [x] The most-recently-used blob is withheld from budget eviction (verifies spec: CACHE)
- [x] A blob with a read in progress is not evicted, and stays a candidate for a later pass (verifies spec: CACHE)
- [ ] Outbox blobs are never evicted and count against neither budget nor eviction (verifies spec: CACHE)
- [x] Free-disk-floor eviction has no protected blob, unlike budget eviction (verifies spec: CAP)
- [x] A non-finite budget evicts nothing rather than everything (verifies spec: CACHE)
- [x] Eviction stops once its byte target is met (verifies spec: CACHE)
- [x] A blob whose deletion fails is skipped and the pass continues (verifies spec: CACHE)
- [x] Concurrent reads of one blob hold the deferral until the last releases (verifies spec: CACHE)

### Admission ordering

- [x] Content is placed at its fan-out path before it is registered (verifies spec: CAS)
- [x] A crash between placement and registration leaves an adoptable orphan, never a row pointing at missing bytes (verifies spec: CAS)
- [x] Admission of content already stored is a no-op that shares the existing blob (verifies spec: CAS)
- [ ] The free-disk floor is rechecked periodically while writing content of unknown size (verifies spec: CAP)
- [x] The store refuses rather than cross into the reserve, after asking the host to evict (verifies spec: CAP)
- [x] Staged content that hashes to something else is discarded rather than admitted (verifies spec: CAS)
- [x] Committing with nothing staged reports not-found rather than hashing a missing file (verifies spec: XFER)

## Host contract tests

One suite, run against every host implementation (the server's and mobile's), so a
divergence fails on the host that diverged.

- [ ] `hashFile` returns the algorithm-tagged hash of the bytes on disk (verifies spec: CAS)
- [ ] `hashFile` of empty content returns the defined empty hash (verifies spec: CAS)
- [ ] Registry upsert leaves a live row untouched, so content held as cache stays cache (verifies spec: CACHE)
- [ ] Registry upsert resurrects a soft-deleted row with the incoming tier and reset recency (verifies spec: CAS)
- [ ] Registry upsert is atomic under concurrent admission of the same content (verifies spec: CAS)
- [ ] Recency update is a no-op within the coalesce window and applies outside it (verifies spec: CACHE)
- [ ] Delete is hard, so the same hash can be re-admitted afterwards (verifies spec: CAS)
- [ ] Staging append at the wrong offset writes nothing and reports the real staged size (verifies spec: XFER)
- [ ] Staging append refuses bytes beyond the declared remainder and discards the staging (verifies spec: XFER)
- [ ] Placement into the fan-out path is atomic, so a reader never sees a partial blob (verifies spec: CAS)
- [ ] Free-space reporting reflects the volume the store root sits on (verifies spec: CAP)

## Extraction is behaviour-preserving

- [x] The existing BlobStore, transfer channel, cache and central endpoint suites pass unchanged against the extracted package (verifies spec: XFER, CACHE, CAS)
- [x] The package imports no node builtins, so it loads under React Native (verifies spec: CAS)
- [ ] A blob pushed by a server is fetchable by mobile and the reverse, over the same wire protocol

## Manual

- [ ] A large attachment transfers on a low-end Android device without the bytes entering JS
- [ ] Hashing a large file on a low-end Android device stays within an acceptable time
