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
health check and runbook. Runs on central and facilities; most valuable on bare-metal
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
