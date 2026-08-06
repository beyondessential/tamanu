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

L2 goes first. The card's own description asks for the boundary to be drawn from two
callers rather than guessed from one, and mobile currently has only the `blobs` table,
the `Blob` model and the two migrations from the foundation cards, with nothing using
them. So mobile builds its store and lazy fetch against the ports sketched below, and
this card extracts afterwards, when both callers exist and the seams have been proven
rather than predicted.

The decisions below are settled now rather than after L2 because L2 has to build
against them.

## Decisions

### Sans-io lite, not intent-yielding

The package owns the decisions and the state machines and takes injected async IO
functions. It does not yield intents for a host to interpret. This keeps the
extraction a lift of the existing `BlobTransferChannel`, `FacilityBlobCache` and
`BlobStore` logic rather than a rewrite of code that landed with tests in E2, F2 and
G2.

### The package never touches bytes

Every port is expressed in counts, offsets and paths. The package decides *which*
bytes move and *when*; the host moves them. This falls out of what React Native can
actually do well: `react-native-fs` moves bytes across the JS bridge as base64
strings, but its `downloadFile` and `uploadFiles` do the whole transfer natively
without the bytes entering JS at all. A port that handed the package a byte stream
would force mobile onto its slowest path.

So the transfer ports are whole operations, not byte plumbing:

- `fetchInto(hash, { offset })` returning status, bytes appended, and the total size
  when the host learned it
- `offer(hash, { size })` returning the offer status and the receiver's staged byte
  count
- `pushChunk(hash, { offset, length, totalSize })` returning acknowledgement and the
  receiver's staged byte count

What stays in the package is the arithmetic around them: which offset to ask for,
the stalled-attempt counter that only advances when no new bytes land, the early
exit when staged already covers the known size, which errors are terminal (hash
mismatch, forbidden) against retriable, and the re-offer that relearns the
receiver's position after a failure. The `content-range` / `content-length` parsing
becomes an exported pure helper, since the server needs it and mobile gets the total
from `downloadFile` directly.

### Hashing is `hashFile(path)`, not a streaming hasher

`react-native-fs` exposes a native `hash(filepath, 'sha256')`, so mobile hashes
without a new dependency and without a JS SHA-256 pass on a low-end device.

The deciding argument is port surface: `commitStaged` already re-reads and hashes the
staged file to verify a transfer, so `hashFile` is needed on both hosts regardless.
Requiring a streaming hasher as well would make hosts supply two hashing primitives
where one covers both paths. Only `put()` changes shape, and only to the extent that
it hashes the temp file after writing rather than while writing, which costs a read
pass on direct puts. Push-receive already pays that cost today.

The guarantee is unchanged: the hash is still computed from the bytes the store
wrote, never from one a caller supplied. `content-addressing.md` said "hashes content
as it streams in", which over-constrained the mechanism; it now states the guarantee
without it, and both the current implementation and the extracted one satisfy it.

### Registry is a port with stated semantics

The state machines are registry-driven throughout, and two pieces currently carry
their semantics in Postgres syntax rather than in words:

- `#register`'s upsert, which must be atomic against concurrent puts, must leave a
  live row entirely alone (so content already held as cache stays cache), and must
  resurrect a soft-deleted row with the incoming tier and reset recency.
- `#touch`'s coalesced recency update, which must be a no-op while the recorded
  access is within the coalesce window.

These get written down as port contracts, because SQLite via TypeORM will implement
them differently and this is where behaviour drifts silently between the two.

### Tunables belong to the host

Push chunk size, the recency coalesce window, scan limits, and retry backoff are
host-supplied, not package constants. Mobile's viable chunk size is far smaller than
the server's 8 MB, and `BlobTransferChannel` already takes `pushChunkBytes` through
its constructor.

### What stays behind

The central-side Express routes, the access-control and facility-scope checks, the
Sequelize models and tasks, settings reads, and the consumers' reference resolvers.
None have a mobile counterpart.

### Package placement

A new package depending on `@tamanu/constants`, `@tamanu/errors` and `@tamanu/utils`,
with no node builtins. Mobile already depends on all three, so the dependency floor
is established. `@tamanu/utils/blobs` keeps the pure hash and fan-out helpers where
they are rather than being absorbed, which avoids churning every existing import for
no gain.
