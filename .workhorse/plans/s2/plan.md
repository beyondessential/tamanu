# Extract a sans-io blob package shared with mobile

Working notes on where the package boundary goes. The card's premise is that the
hashing, fan-out layout, offer/fetch state machine and resume arithmetic should have
one implementation rather than a server copy and a React Native copy.

## What is already shared

`@tamanu/utils/blobs` is dependency-free and already consumed by both sides:
`formatBlobHash`, `parseBlobHash`, `blobPathSegments`. The hash format and the
fan-out layout are therefore not part of what this card still has to extract. Its
own header says as much ("Dependency-free so they can be used from both servers and
mobile"), so E2 already took that slice.

What remains duplicated if mobile writes its own is the behaviour, not the format:

- The fetch state machine (`BlobTransferChannel.fetchFromCentral`): resume offset
  from staged size, learning the total from `content-range` / `content-length`,
  the stalled-attempt counter that only advances when no new bytes land, the
  early-exit when staged already covers the known size, and the truncated-body
  path that backs off the same as an error.
- The push state machine (`pushToCentral` / `#pushFrom`): offer, resume from the
  server's `receivedBytes`, chunking at the push chunk size, re-offer on failure
  to relearn the server's position, and which errors are terminal (hash mismatch,
  forbidden) rather than retriable.
- The outbox pusher policy: oldest-first among eligible blobs, eligibility from
  reference resolvers, one transfer in flight per blob, demote on acknowledgement,
  a failure never blocking the queue.
- The eviction policy: LRU ordering, the withheld most-recently-used blob, active
  read deferral, budget-as-target vs the free-disk floor as the hard bound.
- The store's admission ordering rules: hash while writing to temp, atomic rename
  into the fan-out path, register after placement so a crash leaves an adoptable
  orphan rather than a row pointing at missing bytes.

## Seams that decide the shape

### Hashing

The server hashes while streaming into the temp file, which is what makes the
recorded hash provably the bytes actually stored. React Native has no Node
`crypto`, so the package cannot hash itself. Two shapes, and they are not
equivalent:

- **`hashFile(path)` port**, satisfied natively (`react-native-fs` exposes a
  native `hash`) and by a read-back pass on the server. Cheap on device, but
  admission becomes write-then-hash, so the store reads every blob twice and the
  "hashed as it streams in" property in `content-addressing.md` no longer holds
  literally.
- **Streaming hasher port**, host-supplied. Preserves the current property, but on
  device means a JS SHA-256 over the whole file, which is the wrong cost on the
  low-end Androids Tamanu targets.

`commitStaged` has the same question and is the more sensitive one: it re-hashes
the staged file to verify a transfer, and that verification is what makes a
delivered blob trustworthy.

### Streams

Every IO boundary currently speaks Node `Readable`: `put(source)`, `stage(hash,
source)`, `get()` returning a stream, `pipeline(stream, res)` on the serving route.
React Native has none. Sans-io in its strict form means the package yields intents
and the host performs the IO, which is a rewrite of `BlobStore`,
`BlobTransferChannel` and `FacilityBlobCache` rather than a lift of them, and those
landed with tests in E2/F2/G2.

### Registry

The state machines are registry-driven throughout (tier, `lastAccessedAt`,
`eligibleSinceTick`, `integrityState`). Two pieces are Postgres-specific and carry
real semantics:

- `#register`'s `INSERT … ON CONFLICT (hash) DO UPDATE … WHERE deleted_at IS NOT
  NULL`, which is race-safe against concurrent puts, resurrects soft-deleted rows,
  and deliberately leaves live rows' tier alone.
- `#touch`'s coalesced `UPDATE … WHERE last_accessed_at < now() - make_interval(…)`.

Mobile is SQLite via TypeORM. These become port operations whose semantics have to
be specified rather than implied by the SQL, and this is where behaviour is most
likely to drift silently between the two implementations.

### HTTP

The server side goes through `CentralServerConnection.fetch` with its query,
`retryAuth` and `returnResponse` conventions; mobile has its own client. A narrow
port covering ranged GET, the offer POST and the offset-addressed content PUT.

## Sequencing

The card's own description says this is best done once mobile's blob work has shown
which seams are real, so the boundary is drawn from two callers rather than guessed
from one. L2 (mobile blob storage and lazy fetch) has not been built: mobile has the
`blobs` table, the `Blob` model and the two migrations from the foundation cards, and
nothing that uses them. Drawing the boundary now is drawing it from one caller.
