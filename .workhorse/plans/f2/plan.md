# Fetch-by-hash blob transfer subprotocol — plan

F2 builds the symmetric channel that moves blob bytes between servers by hash,
independent of record sync direction. The epic-level spec for this territory
already exists as the Blob transfer spec (`specs/blob-storage/transfer.md`, id
XFER); F2's spec work deepens it to implementable acceptance criteria, and F2's
build delivers the channel itself.

## Boundaries with sibling cards

- **E2 (blob store primitive)** — below F2. Provides `BlobStore`
  `has`/`get`/`put`/`delete` and the local `blobs` registry. F2 consumes it and
  adds no storage semantics.
- **G2 (facility outbox and LRU cache)** — above F2. Owns the background pusher,
  outbox durability, and eviction. F2 provides the primitive operations G2
  drives (offer, fetch, acknowledge) but not the scheduling policy.
- **H2 (access control)** — owns who may fetch or push. F2 leaves authorisation
  hooks at the reference layer and doesn't define scoping rules.
- **J2/K2 (consumers)** — F2 changes no consumer table. The existing
  try-local-then-central attachment GET
  (`packages/facility-server/app/routes/apiv1/attachment.js`) is the pattern
  being generalised, but rewiring attachments onto it is J2's job.

## Technical grounding

- Current attachment GET buffers the whole blob in memory and proxies central
  via `CentralServerConnection.fetch` with bounded backoff — no streaming, no
  resume, no availability signalling. This is the baseline the channel replaces.
- The serving spec (SERVE) already requires streamed, ranged, hash-validated
  responses for client-facing serving; the transfer channel should share those
  properties server-to-server.
- The multiplexing facility–central client is PR #10656, cherry-picked onto this
  branch (2026-08-05): `@passcod/faith` 0.3.0 becomes the fetch implementation
  for the facility's `CentralServerConnection` (opt-out via
  `TAMANU_DISABLE_FAITH_FETCH`), giving HTTP/2 connection multiplexing; the
  HTTP/3 upgrade exists but is disabled for now. Many-small-blob efficiency
  comes from riding this client rather than building custom batching. If the PR
  merges to main independently, the duplicate commits fall out at the next
  rebase.

## Design areas to nail down

1. **Protocol surface** — decided (2026-08-05): three hash-keyed operations —
   probe (availability without bytes), fetch (streamed, ranged, resumable from
   offset, verified whole on completion), and offer/push (resumable upload,
   verified on receipt). Acknowledgement is the push completion signal: central
   acknowledges only once bytes are verified and durably stored, releasing the
   origin's outbox copy. All folded into the transfer spec.
2. **Resumability** — decided (2026-08-05): both directions resume from bytes
   already delivered; verification always covers the complete blob including
   pre-interruption parts. In the spec.
3. **Content-pending response shape** — the two-state distinction
   (upload-pending vs fetch-pending) was already in the transfer spec; the probe
   now reports the same states. The concrete response encoding is
   implementation-level detail to settle during build.
4. **Direction and reachability** — decided (2026-08-05): the operations are
   symmetric (offer, fetch, acknowledge, probe by hash) but transport
   connections are always established facility→central, matching sync's
   topology. Central acquiring a blob is realised as origin-initiated push
   (offer + upload); facilities fetch on demand. No new inbound surface at
   facilities, works through NAT/firewalls, and mobile reuses the same
   semantics. Facility-to-facility movement relays via central, which is the
   authoritative store anyway.

## Implementation checklist

Rebased the card onto E2's branch (2026-08-05), which carries the `BlobStore`
primitive, the `blobs` registry, config/settings for the store root and disk
reserve, and the SHA-256 decision. The faith (PR #10656) HTTP/2 client rides
along on this branch.

Transport decision: push moves bytes in bounded chunks (buffer per request,
offset-addressed) rather than a streamed request body, because the faith fetch
implementation's streaming-body support is unproven and chunks give natural
resume points; fetch streams the response body and appends to a staging file,
resuming via Range. Verification happens over the complete staged file at
commit, satisfying the resume-then-verify criterion.

- [x] Constants: blob availability states (available, awaiting-upload,
      awaiting-fetch) and offer statuses
- [x] Errors: BlobHashMismatchError with its own problem type so the origin can
      distinguish a mismatch from a retriable transfer fault
- [x] BlobStore: ranged `get`, `stat`, and the resumable staging API
      (`stagedSize`, `stage` at offset with floor checks, `commitStaged` with
      whole-file verification, `discardStaged`), staging surviving restarts
- [x] BlobStore tests for the above
- [x] Central server: store constructed in ApplicationContext; blob transfer
      routes at `/api/blob` (availability probe, ranged fetch GET, offer,
      chunked PUT with acknowledge-on-verified-store), gated by sync-client
      device scope
- [x] Central endpoint tests: auth, availability, fetch + range, offer/push,
      resume, idempotency, hash mismatch (central test context gained a
      temp-rooted blob store)
- [x] Facility server: store constructed in ApplicationContext; a
      BlobTransferChannel (availability incl. awaiting-fetch derivation,
      resumable fetch-from-central, chunked resumable push-to-central,
      read-through open) generalising the try-local-then-central pattern
- [x] Facility channel tests against a fake central backed by a second real
      store, with dropped-stream and cut-chunk failure injection
- [x] Test-cases file
- [x] Post-review hardening (2026-08-05): per-hash staging lock in BlobStore so
      concurrent transfers of one hash cannot interleave appends; central fetch
      GET moved from pipe to stream pipeline so aborted downloads do not leak
      file handles; fetch resume probes availability when staging exists and
      commits directly once staged bytes cover the size, fixing the wedge when
      a crash lands between the final append and commit
- [x] Review round 2 (2026-08-05): removed the redundant registry lookup on the
      serving path (get accepts the stat the caller already fetched); bounded
      the central push ingest with a maxBytes cap so an origin sending more than
      it declared is refused before the excess reaches disk; wrapped the
      push re-offer in its own try/catch so a transient re-offer failure counts
      as a stalled attempt instead of aborting the push and swallowing the
      original error; made the auth tests cover both middleware branches (the
      missing-device guard and the scope assertion) explicitly. The reviewer's
      premise on the scope test was mistaken — logging in with a deviceId
      already registers the device, so ensureHasScope was in fact exercised —
      but the split makes both branches unambiguous.
- [ ] Lint and test runs — not runnable in this environment, verified by CI

Out of scope, owned by siblings: background pusher and eviction (G2), data
scoping and the push reference gate (H2), consumer rewiring (J2/K2), mobile
(L2). The attachment GET keeps reading the attachments table until J2 adopts
the channel.

## Open questions

- Transfer surface: working decision is to ride the existing authenticated
  facility-central client (`CentralServerConnection`), which now carries the
  multiplexing fetch implementation. H2 owns the scoping rules that apply on
  that surface. Revisit only if H2 finds the shared surface unworkable.
- What does "a facility may also serve a blob it currently holds" require of F2
  now — anything beyond the local-then-central read path that already exists?
