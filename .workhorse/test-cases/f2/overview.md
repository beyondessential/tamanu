# Fetch-by-hash blob transfer subprotocol — test cases

Scenarios verifying the transfer channel between facility and central servers.
Automated coverage lives in the BlobStore unit tests (staging suite), the
central endpoint tests (`packages/central-server/__tests__/blobTransfer.test.js`),
and the facility channel tests
(`packages/facility-server/__tests__/blobTransfer/BlobTransferChannel.test.js`).

## Channel operations

- [x] Probing an unheld hash on central reports awaiting-upload (verifies spec: XFER)
- [x] Probing a held hash on central reports available with its size (verifies spec: XFER)
- [x] Facility availability distinguishes available, awaiting-fetch, and awaiting-upload (verifies spec: XFER)
- [x] Malformed hashes are rejected on every endpoint (verifies spec: XFER)
- [x] Channel endpoints refuse unauthenticated requests (verifies spec: BLAC)
- [x] Channel endpoints refuse an authenticated caller with no device (missing-device guard) (verifies spec: BLAC)
- [x] Channel endpoints refuse a registered device lacking the sync-client scope (scope assertion) (verifies spec: BLAC)

## Push

- [x] A blob offered and delivered in offset-addressed chunks is verified and acknowledged (verifies spec: XFER)
- [x] Offering content central already holds skips the byte transfer (verifies spec: XFER)
- [x] A push cut mid-chunk resumes from the bytes central staged, learned by re-offering (verifies spec: XFER)
- [x] Acknowledgement is returned only after the content is verified and durably stored (verifies spec: XFER)
- [x] Delivered content that does not hash to the offered hash is discarded and rejected (verifies spec: XFER)
- [x] A chunk at the wrong offset is rejected without corrupting the staging (verifies spec: XFER)
- [x] Staging that overruns the declared total is discarded (verifies spec: XFER)
- [x] A zero-byte blob transfers like any other (verifies spec: CAS)
- [x] Pushing stops with the free-disk floor intact when the store refuses new content (verifies spec: CAP)
- [x] A push that declares fewer bytes than it sends is refused before the excess reaches disk, and the staging discarded (verifies spec: XFER, BLAC)
- [x] A re-offer that itself fails transiently is retried, not aborted, and the original error is preserved when attempts exhaust (verifies spec: XFER)

## Fetch

- [x] A fetch streams the bytes with the hash as entity tag (verifies spec: XFER, SERVE)
- [x] An interrupted fetch resumes from the bytes already staged via a range request (verifies spec: XFER)
- [x] The complete fetched content is verified against the hash before admission, including pre-interruption bytes (verifies spec: XFER)
- [x] Fetching content already held locally skips the transfer (verifies spec: XFER)
- [x] Fetching a hash central does not hold surfaces the awaiting-upload state (verifies spec: XFER)
- [x] The read-through open serves local bytes, fetching on a local miss (verifies spec: XFER)
- [x] An unsatisfiable range is refused with the blob's true extent (verifies spec: SERVE)

## Staging durability

- [x] Staged bytes survive a restart and the transfer resumes from them (verifies spec: XFER)
- [x] A source failure partway through an append keeps the staged bytes as the resume point (verifies spec: XFER)
- [x] Concurrent appends for one hash are serialised, never interleaved; the loser resumes from the new staged size (verifies spec: XFER)
- [x] A fetch interrupted between the final append and commit resumes by verifying the staging, not by re-downloading (verifies spec: XFER)
- [x] Fully staged bytes that fail verification are discarded and the next fetch starts clean (verifies spec: XFER)

## Manual / operational

- [ ] Push a multi-gigabyte file between real servers over a throttled, flaky link and confirm it completes with bounded memory
- [ ] Confirm many small blobs push efficiently over the multiplexed (faith) facility-central connection
- [ ] Confirm a facility server restart mid-push resumes rather than restarts the transfer
- [ ] Confirm central acknowledges only after fsync (pull the plug testing is P2/N2 territory, a smoke check suffices here)
- [ ] Confirm repeatedly aborted downloads do not accumulate open file handles on central (lsof over a soak run)
