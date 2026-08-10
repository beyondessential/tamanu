# Content-addressed blob storage — card breakdown

Slices the epic into spawned cards. Attachments are stored on the filesystem as
content-addressed storage (BLAKE3, lowercase hex, algorithm-namespaced
`ab/cd/<rest>` fan-out) with the DB row holding only the hash, built as a general
blob-store primitive that attachments and assets consume. This moves attachment and
asset bloat out of the database — a volume that varies widely across deployments,
reaching hundreds of gigabytes at the largest sites — and ends the changelog
duplication of write-once blobs, which applies regardless of deployment size.
Blobs are retained indefinitely; retention policy and legal erasure are out of
scope, deferred to a future Tamanu-wide obligations feature. Entries are ordered by
dependency: the foundation and security cards first, then the consumer and
operational cards, then the resilience cards — of which antivirus and error
correction are optional, while integrity verification runs by default.

## Content-addressed blob store primitive · E2

The core on-disk store and its interface: a `BlobStore` with `has`/`get`/`put`/`delete`,
the algorithm-namespaced two-level lowercase-hex fan-out layout, atomic
temp-write-then-rename with Windows/NTFS handling, and a persistent configurable
store root that can sit on a separate volume to avoid contention. Enforces a system
free-disk floor so the store never starves the host database or system — evicting
cache, then refusing new blobs — on any server it runs, central included. Content is
hashed with BLAKE3 and stored algorithm-tagged; the card
carries a research spike to confirm a maintained BLAKE3 implementation for both
Node and React Native and to benchmark it against hardware-accelerated SHA-256,
and is empowered to fall back to SHA-256 with evidence if the React Native story or
performance is inadequate. Owns the single local `blobs` registry — authoritative
content record on central, cache/state index on facility and mobile, never synced
and never in the change log. Foundation for everything else; holds no consumer
wiring or transfer logic. Cross-algorithm byte deduplication is deliberately out of
scope until an algorithm migration is actually planned.

## Fetch-by-hash blob transfer subprotocol · F2

The symmetric primitive that moves bytes between servers independently of record
sync direction: offer/fetch a blob by hash, verify content on receipt, and stream
resumably so large files survive poor links. Records always sync carrying only the
hash, so this card also defines the content-pending availability state a server
reports when it holds a reference but not yet its bytes, evident in the response and
distinguishing upload-pending from fetch-pending. Generalises the existing
try-local-then-central attachment GET into a reusable channel, and can lean on
Tamanu's multiplexing HTTP/2-3 facility–central client for efficient many-small-blob
transfers rather than building its own batching. Depends on the blob store
primitive; does not change any consumer table yet.

## Facility blob outbox and LRU cache · G2

Turns the facility store into an outbox plus cache: un-pushed blobs are durable and
never evicted until central confirms them, pushed blobs demote to an LRU/size-bounded
cache that refetches on demand. Replaces delete-after-push, adds the background
pusher, disk-full backpressure, and a local-only cache index (no sync, no changelog).
Depends on the primitive and the transfer subprotocol.

## Blob access control · H2

The security model for content-addressed storage: authorisation stays at the
reference layer so the blob endpoint is never an unauthenticated CDN. Server-to-server
fetch applies the same facility data scoping as record sync, and push is sync-first:
central accepts a blob only once its referencing record has synced, so it holds no
unreferenced pushed content and the channel cannot be used to exhaust central
storage. A bounded-slack variant accepting eager pushes ahead of their references
can be layered on later if upload responsiveness needs it. Encryption at rest is out of
scope — already provided by the required disk-level encryption. May be folded into
the foundation cards rather than built separately.

## Route attachments through the blob store · J2

Rewires the attachments table and every attachment read/write path onto the blob
store so new attachments are stored on disk going forward: user uploads, patient
letters, survey photos, FHIR lab PDFs, profile pictures, and web download. Adds the
`hash` column, local hash-based id assignment for offline-tolerant upload, and
streaming/range serving, with readers tolerating both new (hash) and legacy
(in-database) rows during transition. Presents a single awaiting-content message for
a content-pending file for now, though the response distinguishes upload-pending
from fetch-pending so the presentation can be refined without a backend change.
Depends on the foundation cards; the bulk move of existing data is the backfill
card's job.

## Route assets through the blob store · K2

Rewires the assets table (letterhead logos, certificate images) onto the blob store
so new assets are stored on disk, and adds fetch-on-miss to the facility-side asset
readers that today assume the bytes are local. Covers certificate and patient-letter
rendering paths, with readers tolerating both new (hash) and legacy (in-database)
rows during transition. Depends on the foundation cards; the bulk move of existing
data is the backfill card's job.

## Extract a sans-io blob package shared with mobile · S2

Lifts the store management and transfer protocol logic out of `@tamanu/database` and
the two servers into a dependency-free package that mobile can consume, so the
hashing, fan-out layout, offer/fetch state machine, and resume arithmetic have one
implementation rather than a server copy and a React Native copy. Sans-io: the
package decides what to read, write and send, and the host supplies the filesystem
and HTTP. Best done once mobile's blob work has shown which seams are real, so the
boundary is drawn from two callers rather than guessed from one.

## Mobile blob storage and lazy fetch · L2

Aligns the mobile app's already file-backed attachment model with the blob transfer
subprotocol, replacing inline-in-sync-record bytes with lazy fetch and a bounded
cache suited to constrained device storage. Depends on the foundation cards.

## Backfill migration · M2

Moves the existing in-database blobs onto the filesystem as a batched, throttled
background job — a volume ranging from modest to hundreds of gigabytes across
deployments, so it must be resumable and bounded at any scale. Runs mostly on
central, where the attachment and asset bytea live; while it runs, reads resolve from
either the store (backfilled) or the database column (not yet), all within a single
version. Decides how to treat the historical blob copies already duplicated into the
changelog — leave, purge, or relocate to the store — noting that new writes stop
duplicating automatically once live rows carry only a hash. No cross-version
compatibility is needed: the feature lands on a breaking release and Tamanu rejects
minor-version sync skew, so all servers in a sync network share it. Includes rollback.

## Blob store backups and restore · N2

Specifies how the blob store and database stay mutually consistent across backup and
restore: the database-then-store ordering that guarantees no dangling references,
incremental append-only store backup, and the restore procedure. Facility backups
include the store, since they drive upgrade testing and must reproduce the true
facility state rather than one part-reconstituted from central. Implemented by
bestool on a separate board, not in the Tamanu codebase, but specified here as part
of this epic. Updates the facility-restored-from-backup runbook. Depends on the store
being in place.

## Blob integrity scrub and self-heal · P2

Verification of stored blobs against their hash: on receipt, on read (whole-blob,
inexpensive at typical sizes; ranged reads of large blobs rely on receipt and scrub
rather than per-range verification), and by a scheduled incremental scrub that covers
cold blobs and checks referential integrity. Corruption is repaired via the self-heal
ladder — error correction, peer, then backup — with severity graded by whether the
copy is authoritative. Records scrub state in the local index and surfaces a Canopy
health check and runbook. The scrub also reconciles the store against the registry in
the disk-to-registry direction, adopting a blob present on disk that no registry entry
names: unregistered content is otherwise permanent, being never served and never
reclaimed (eviction works off a registry-derived budget and facilities collect no
orphans) while still occupying disk the free-disk floor measures. This is how a
restored server converges, its database and store having been captured at different
moments, and how a server recovers an admission interrupted between the blob reaching
its location and being registered. Runs on central and facilities; most valuable on bare-metal
and NTFS deployments where the filesystem offers no checksum repair. Per-range
verified streaming (Bao) is a deferred option, checked in the BLAKE3 research spike
only if large-file range verification is later wanted.

## Antivirus scanning for stored blobs · Q2

Optional malware scanning of user-uploaded blobs by actively invoking the host
scanner (clamd, Defender, or ICAP) rather than building one, caching verdicts by
hash and treating a quarantine as a first-class, content-addressed, propagating
state that suppresses self-heal. The serve policy is an administrator setting
following a hardening pathway — off, serve unless known-bad (the default once
enabled), then serve only when known-good. A fast-follow the foundation accommodates
rather than a prerequisite to land the feature; no-op when unconfigured.

## Optional error correction for blob storage · R2

An off-by-default parity sidecar (Reed-Solomon) for substrates that lack their own
redundancy, chiefly NTFS bare metal, so a single isolated copy can self-repair
limited corruption before falling through to peer or backup. Correction-rate
telemetry doubles as an early warning of failing media. Shares the scrub's
detect-and-repair path.

## Epic review follow-ups

Verification of a stashed reviewer finder-pass (2026-08-10) against the merged
stack, 2026-08-11. Findings the finders got wrong are recorded too, so the same
ground isn't re-walked.

### Fixed on the epic branch

**The facility read path had no servable-state gate.** Central grades a copy with
`servableStat` (only `verified` is servable) and answers for a quarantined blob
exactly as for content it does not hold. The facility used bare `stat()`
truthiness at every equivalent gate, so a quarantined local copy was
simultaneously advertised as available, never refetched, and refused at `get()` —
a permanent 404 for content central often still holds, with no automated or
documented way back. `servableStat` now lives on `BlobStore` and is used by both
servers: the cache's read-through treats an unservable copy as a miss and resolves
it from central, `availability()` stops advertising it, `pushToCentral` refuses it
before the offer (each attempt previously spent ~6 offer round-trips and ~5s of
backoff per pass to reach the same refusal from the read that feeds it), and
central's attachment route answers 202 awaiting-content rather than a 404 whose
message disclosed the quarantine. `fetchFromCentral`'s `ignoreLocal` option went
with it: the servable check is what the self-heal path needed it for.

**The API process never wired the transfer channel onto the healer.** The API
branch of `startApp` runs `setupApiRuntime`, not `setupSyncRuntime`, so only the
attachment route's own lazily built channel exists in that process — and it was
set on the cache alone. A read-path corruption graded there reached the escalation
rung with the peer rung untried.

### Open, needing a decision rather than a patch

- **Orphan adoption defaults to the evictable cache tier** (`BlobStore.adopt` →
  `#register` with no tier). The facility restore runbook has the store captured
  *after* the database, so a restored facility routinely has blob files its
  registry does not name — including un-pushed outbox content. Reconciliation
  adopts those as cache: never pushed (the pusher filters `tier=OUTBOX`) and
  evictable, so the only durable copy can be destroyed silently, while the outbox
  depth query shows nothing wrong. The scrubber cannot infer the tier from a file;
  it would need a server-supplied hook, the way it already takes `heal` and
  `findUndeliverableReferences`. Highest-severity item outstanding.
- **The runbook's file-drop restore never clears a quarantine.** §5 and §6 both
  promise that placing good bytes in the fan-out path is verified and registered on
  the next pass. Verification excludes quarantined rows and reconciliation skips
  registered hashes, so a quarantined hash matches neither: only the `absent` case
  works as documented. Either the scrub re-checks a quarantined blob whose bytes
  changed, or the runbook stops promising it.
- **Central's referential faults are never persisted.** They have no `blobs` row,
  so `recordIntegrityState` is a zero-row update: invisible to anything querying
  the registry, and re-logged at `log.error` every hourly pass with no dedup.
  `findUndeliverableReferences` also has `LIMIT` with no `ORDER BY`, so a backlog
  past the limit returns an arbitrary subset each pass, and it filters neither
  `record.deleted_at` nor `sync_lookup.is_deleted`, so deleted attachments whose
  blobs never pushed hold the limit budget ahead of live ones forever.
- **Rollback halted permanently by one corrupt blob** (M2). Recorded in the P2
  plan; needs a product call on skip-and-report vs abort.

### Lower severity, recorded not fixed

- `heal()` grades severity on the registry row as it stood at scrub-pass start, so
  a blob demoted outbox→cache mid-pass is graded outbox. Self-corrects via the
  refetch in the common case, since the demotion means central holds it.
- `#healCache` calls `blobStore.delete()` directly, bypassing the cache's
  `#activeReads` retain map; an in-flight read gets a 404 instead of the refetch
  path. Next read recovers.
- `delete()` swallows Windows EPERM/EBUSY unlink failures by design (the row is
  gone, so the file is an adoptable orphan), which means reconciliation can
  re-adopt a file the healer just dropped, or un-free evicted budget.

### Ruled out — the finders were wrong

- Ranged reads serving corrupt bytes: `get()` refuses a quarantined blob up front
  regardless of range.
- Central 404ing an absent-state blob instead of 202: `stat()` is already null when
  the bytes are gone, so that path returns 202 today.
- Same-size corruption delivered as a byte-complete 200: `verifyingStream` errors
  at flush before the stream ends, which is the inherent best case for whole-blob
  streaming.
