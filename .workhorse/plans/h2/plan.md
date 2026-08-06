# Blob access control (H2) plan

Notes from spec drafting. The spec is `specs/blob-storage/access-control.md` (BLAC).

## Enforcement points

- The transfer channel's routes (central's `blobTransfer.js`, built on F2) already
  gate on the authenticated device with the sync-client scope, matching the
  transfer channel authentication criterion. H2's implementation layers the
  reference-level scoping inside those handlers: fetch/availability check the hash
  against references within the requesting server's sync scope; offer/content
  check the hash against references synchronised from the pushing server.
- End-user access needs no new enforcement: blob content is only reachable through
  record routes (e.g. attachment GET), which carry the referencing record's
  permission check. The work is to keep it that way as consumers move onto the
  store (J2, K2), not to add a new check.

## Fetch scoping mechanics

- Central-side scope evaluation should reuse the sync scoping machinery (the sync
  lookup filters, including the sensitive-facility rule in
  `buildEncounterLinkedLookupFilter.ts`) rather than re-deriving entitlement per
  consumer table, so blob scoping cannot drift from record scoping.
- Out-of-scope and not-held must be indistinguishable in responses (both the
  availability probe and the fetch), per BLAC. Easiest shape: resolve scope first
  and answer "awaiting upload"/not-held whenever the scope check fails.
- **Scope is the declared facility set, not the user's entitlement** (review fix).
  Record sync scopes a pull to the `facilityIds` the server declares in its
  session, validated against `canAccessFacility` — typically the one facility the
  server runs. The user's entitlement (`allowedFacilityIds`) defaults to *every*
  facility (`restrictUsersToFacilities` is false by default), so scoping by it
  drops the filter entirely and makes blob access wider than sync. The channel
  therefore carries `facilityIds` on every request (facility side:
  `getServerFacilityIds()` into the `BlobTransferChannel`), central validates each
  against `canAccessFacility` exactly as the sync session does, and scopes to that
  declared set. Mobile (L2) must pass its facilityIds the same way once it wires
  the channel.

## Quarantine on the read path (review fix)

- `BlobStore.stat` returns quarantined rows but `get` refuses them, so the access
  routes must not treat a quarantined blob as servable: availability and fetch use
  a `servableStat` that reports quarantined as not-held, keeping the two consistent
  and disclosing nothing (integrity.md: "never served").
- The **offer/push** path keeps plain `stat` (already-stored includes quarantined):
  making offer invite a re-push would no-op in `commitStaged` against the retained
  bytes and falsely acknowledge. Replacing a quarantined copy via push is the
  self-heal ladder, which is P2 (integrity) — not gated here.

## Push expectation mechanics

- "Expected hash" = referenced by a synchronised record central holds **within the
  pushing server's data scope**. Scope-based rather than origin-attributed: the
  integrity spec's peer healing has central accept a blob from "a facility that
  holds the blob within its data scope", which strict from-that-facility
  attribution would block, and sync_lookup's `pushed_by_device_id` churns on
  later updates by other servers, which would strand an origin's outbox blob.
  Fetch and push therefore share one reference-scope predicate. BLAC's wording
  updated to match.
- The lookup runs against the consumer tables' hash columns, which J2
  (attachments) and K2 (assets) introduce, so H2's push gating lands against
  whichever consumer columns exist. Until a consumer carries hashes, the gate
  correctly refuses everything.
- Refusal must apply at the offer and at every content PUT, including resumed
  segments, so unexpected content never stages (BLAC).

## Known limits (for consumer cards to pick up)

- The scope predicate mirrors the sync_lookup pull filter (patient marked-for-sync
  and sensitive-facility rules) but not the per-session `syncAllLabRequests`
  widening, which central cannot evaluate per device outside a session. Facilities
  relying on syncAllLabRequests will get lab-linked records without being able to
  fetch their blobs; J2 should revisit when attachments carry hashes.
- The gate reads sync_lookup, so it presumes `sync.lookupTable.enabled` (the
  default and the modern sync path). A deployment with the lookup table disabled
  would refuse all blob transfers once consumers exist.

## Build checklist

- [x] Rebase onto F2 (store primitive + transfer channel), retarget upstream
- [x] `blobReferences.js` on central: reference-source registry (empty until
  J2/K2) + shared reference-scope predicate over sync_lookup
- [x] Wire scoping into central transfer routes: availability and fetch answer
  as absent when out of scope; offer and content PUT refuse unexpected hashes
  before touching the store, held or not
- [x] Facility channel: a forbidden response fails the push immediately, no
  resume loop, so the pusher moves on (skip-on-failure)
- [x] Rework central blobTransfer tests around seeded references; add scoping
  and gating suites
- [x] Facility channel unit tests for refused offers and mid-push refusal
- [x] Update BLAC wording (scope-based push) and the test-cases file to match

Note: error bodies outside production include a stack (a debug field); the
indistinguishability guarantee is about the production body, so refusals are
thrown from a single site per route and the tests compare bodies with the
stack dropped.

## Sequencing and branch base

- Spec work sits on B2. When H2 moves to implementation, rebase onto F2's branch
  (`workhorse/f2`), which carries both the store primitive (E2) and the transfer
  subprotocol the access checks attach to.
- G2's facility-cache pusher eligibility ("offer only blobs whose referencing
  record has synchronised") is the facility-side half of BLAC's sync-first push;
  the specs cross-reference each other, and the facility-cache side lands with G2.
