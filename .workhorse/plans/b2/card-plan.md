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
dependency; the foundation cards come first, the resilience cards are optional and
can follow.

## Content-addressed blob store primitive

The core on-disk store and its interface: a `BlobStore` with `has`/`get`/`put`/`delete`,
the algorithm-namespaced two-level lowercase-hex fan-out layout, atomic
temp-write-then-rename with Windows/NTFS handling, and a persistent configurable
store root. Content is hashed with BLAKE3 and stored algorithm-tagged; the card
carries a research spike to confirm a maintained BLAKE3 implementation for both
Node and React Native and to benchmark it against hardware-accelerated SHA-256,
and is empowered to fall back to SHA-256 with evidence if the React Native story or
performance is inadequate. Owns the single local `blobs` registry — authoritative
content record on central, cache/state index on facility and mobile, never synced
and never in the change log. Foundation for everything else; holds no consumer
wiring or transfer logic. Cross-algorithm byte deduplication is deliberately out of
scope until an algorithm migration is actually planned.

## Fetch-by-hash blob transfer subprotocol

The symmetric primitive that moves bytes between servers independently of record
sync direction: offer/fetch a blob by hash, verify content on receipt, and stream
resumably so large files survive poor links. Records always sync carrying only the
hash, so this card also defines the content-pending availability state a server
reports when it holds a reference but not yet its bytes. Generalises the existing
try-local-then-central attachment GET into a reusable channel. Depends on the blob
store primitive; does not change any consumer table yet.

## Facility blob outbox and LRU cache

Turns the facility store into an outbox plus cache: un-pushed blobs are durable and
never evicted until central confirms them, pushed blobs demote to an LRU/size-bounded
cache that refetches on demand. Replaces delete-after-push, adds the background
pusher, disk-full backpressure, and a local-only cache index (no sync, no changelog).
Depends on the primitive and the transfer subprotocol.

## Route attachments through the blob store

Rewires the attachments table and every attachment read/write path onto the blob
store so new attachments are stored on disk going forward: user uploads, patient
letters, survey photos, FHIR lab PDFs, profile pictures, and web download. Adds the
`hash` column, local hash-based id assignment for offline-tolerant upload, and
streaming/range serving, with readers tolerating both new (hash) and legacy
(in-database) rows during transition. Depends on the foundation cards; the bulk move
of existing data is the backfill card's job.

## Route assets through the blob store

Rewires the assets table (letterhead logos, certificate images) onto the blob store
so new assets are stored on disk, and adds fetch-on-miss to the facility-side asset
readers that today assume the bytes are local. Covers certificate and patient-letter
rendering paths, with readers tolerating both new (hash) and legacy (in-database)
rows during transition. Depends on the foundation cards; the bulk move of existing
data is the backfill card's job.

## Mobile blob storage and lazy fetch

Aligns the mobile app's already file-backed attachment model with the blob transfer
subprotocol, replacing inline-in-sync-record bytes with lazy fetch and a bounded
cache suited to constrained device storage. Depends on the foundation cards.

## Backfill and rolling-upgrade migration

Moves the existing in-database blobs onto the filesystem as a batched, throttled
background job — a volume ranging from modest to hundreds of gigabytes across
deployments, so it must be resumable and bounded at any scale. Decides how to treat
the historical blob copies already duplicated into the changelog — leave, purge, or
relocate to the store — noting that new writes stop duplicating automatically once
live rows carry only a hash. Handles version skew across a rolling upgrade,
dual-read behind a flag, and rollback. The gating operational risk; its version-skew constraints feed back
into the subprotocol design, so it should be specced early even though it lands late.

## Blob store backups and restore

Defines how the blob store and the database stay mutually consistent across backup
and restore, including the write-order rule, incremental append-only backup, and the
restore procedure. Updates the facility-restored-from-backup runbook. Depends on the
store being in place.

## Blob integrity scrub and self-heal

A scheduled content-and-referential integrity check that reads stored blobs, compares
them to their hash, and repairs corruption via the self-heal ladder, with read-time
verification on the hot path. Records scrub state in the local index, surfaces a
Canopy health check and runbook, and grades response severity by whether the copy is
authoritative. Optional and off-by-default; targets bare-metal and NTFS deployments.

## Antivirus scanning for stored blobs

Optional malware scanning of user-uploaded blobs by actively invoking the host
scanner (clamd, Defender, or ICAP) rather than building one, caching verdicts by
hash and treating a quarantine as a first-class, content-addressed, propagating
state that suppresses self-heal. Includes the serve policy for not-yet-scanned
content. No-op when unconfigured.

## Optional error correction for blob storage

An off-by-default parity sidecar (Reed-Solomon) for substrates that lack their own
redundancy, chiefly NTFS bare metal, so a single isolated copy can self-repair
limited corruption before falling through to peer or backup. Correction-rate
telemetry doubles as an early warning of failing media. Shares the scrub's
detect-and-repair path.

## Blob access control and encryption at rest

The security model for content-addressed storage: authorisation stays at the
reference layer so the blob endpoint is never an unauthenticated CDN, plus
encryption at rest and its interaction with deduplication. May be folded into the
primitive rather than built separately; captured here so the decision is explicit.
