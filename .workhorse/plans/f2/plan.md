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

1. **Protocol surface** — the concrete operations: fetch by hash (streamed,
   resumable), offer/push by hash, an availability probe, and the acknowledgement
   that lets an origin demote a blob from outbox to cache. Idempotency of each.
2. **Resumability** — how an interrupted transfer resumes (byte offset / ranged
   continuation), and how receipt verification (hash the full received stream)
   interacts with resuming a partial transfer.
3. **Content-pending response shape** — how a serving server reports "reference
   held, bytes absent", distinguishing upload-pending (origin hasn't delivered)
   from fetch-pending (this server hasn't fetched), in one response.
4. **Direction and reachability** — decided (2026-08-05): the operations are
   symmetric (offer, fetch, acknowledge, probe by hash) but transport
   connections are always established facility→central, matching sync's
   topology. Central acquiring a blob is realised as origin-initiated push
   (offer + upload); facilities fetch on demand. No new inbound surface at
   facilities, works through NAT/firewalls, and mobile reuses the same
   semantics. Facility-to-facility movement relays via central, which is the
   authoritative store anyway.

## Open questions

- Does the transfer channel live on the existing sync-authenticated
  facility–central connection, or as its own authenticated surface? (H2 owns the
  scoping rules, but F2 must pick the surface. Riding `CentralServerConnection`
  is the natural fit now that it carries the multiplexing client.)
- What does "a facility may also serve a blob it currently holds" require of F2
  now — anything beyond the local-then-central read path that already exists?
