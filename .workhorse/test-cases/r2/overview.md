# Optional error correction for blob storage — test cases

Scenarios for R2. Error correction is off by default, so the first thing every case
has to establish is which side of that switch it is on.

Coverage splits three ways. The codec is pure computation, so it is unit tested
against seeded corruption with no filesystem involved. The sidecar and the store
integration are tested against a real filesystem with a fake registry, since what
matters there is bytes on disk. The heal ladder and the tier rules are tested
against a real database on each server, because the grading differs between them.

## Codec (`packages/blobs`, no io)

### Shard geometry

- [x] Shards are cluster-aligned so one bad cluster damages exactly one shard (verifies spec: FEC)
- [x] Reaches 32+3 at the default proportion from 1 MiB up (verifies spec: FEC)
- [x] A large blob splits into groups rather than growing its shards past 1 MiB (verifies spec: FEC)
- [x] Data shards spread evenly across groups, so the last group is not a runt carrying a full group's parity (verifies spec: FEC)
- [x] Overhead stays inside the admission reserve at every size above the floor (verifies spec: CAP)
- [x] The parity shard count scales with the proportion, and a proportion rounding to nothing still buys one shard (verifies spec: FEC)

### Coverage predicate

- [x] Central covers every blob it holds; a facility covers only its outbox (verifies spec: FEC)
- [x] Blobs below the size floor are skipped whatever their tier (verifies spec: FEC)

### Reconstruction

- [x] A single damaged shard is recovered byte for byte (verifies spec: FEC)
- [x] Damage exactly at the parity budget is recovered (verifies spec: FEC)
- [x] A contiguous run within the budget is recovered (verifies spec: FEC)
- [x] Damage spanning data and parity shards is recovered (verifies spec: FEC)
- [x] A blob whose parity alone is damaged is left whole (verifies spec: FEC)
- [x] Damage beyond the budget fails cleanly rather than emitting bytes (verifies spec: FEC)
- [x] Repeated calls in one process recover identically (verifies spec: FEC)
- [x] Regenerating parity over intact content reproduces it byte for byte (verifies spec: FEC)
- [x] Damage located wrongly decodes "successfully" and emits bytes that are not the blob (verifies spec: FEC)
- [x] A group of a blob that fills every shard slot is recovered (verifies spec: FEC)
- [x] A last group holding an unfilled shard slot is recovered (verifies spec: FEC)
- [x] A short final shard is recovered without padding leaking into the blob (verifies spec: FEC)

The mislocation case is the one that justifies the unconditional hash check on the
repair path. It asserts the codec emits wrong bytes, because that is the behaviour
the hash check exists to catch — the codec cannot detect it.

## Sidecar and store integration (real filesystem, fake registry)

### Layout

- [x] The sidecar path is rejected by `blobHashFromPathSegments`, so the store walk reads it as parity rather than as a stray blob (verifies spec: FEC)
- [x] The store walk over a store holding a sidecar yields only the blob (verifies spec: SCRUB)
- [x] The header round-trips the geometry it was written with, so a proportion change does not break an existing sidecar (verifies spec: FEC)
- [x] Bytes that are not a sidecar are rejected rather than misread (verifies spec: FEC)
- [x] Digest table and parity regions do not overlap, and the sidecar is exactly as long as the geometry says (verifies spec: FEC)

### Admission

- [x] A covered blob gets a sidecar and its registry row records that it has one (verifies spec: FEC)
- [x] A blob below the size floor gets none (verifies spec: FEC)
- [x] Nothing is written while error correction is off (verifies spec: FEC)
- [x] A facility covers an outbox blob and not a cache one (verifies spec: FEC)
- [x] The sidecar scales with the configured proportion (verifies spec: FEC)

### Capacity

- [x] An admission is refused when the blob plus its parity would cross the free-disk reserve, where the blob alone would fit (verifies spec: CAP)
- [x] A parity write that cannot fit leaves the blob stored unprotected rather than failing the admission (verifies spec: FEC)

### Repair

- [x] A single damaged shard is repaired in place and the correction recorded (verifies spec: FEC)
- [x] Damage exactly at the budget is repaired (verifies spec: FEC)
- [x] Damage beyond the budget leaves the blob's bytes as they were and records no correction (verifies spec: FEC)
- [x] A blob carrying no parity reports no repair (verifies spec: FEC)
- [x] A reconstruction that does not match the blob's hash is discarded, and it is the hash check that rejects it (verifies spec: FEC)
- [x] No temporary files are left behind, repaired or not (verifies spec: CAS)

### Parity is derived

- [x] A covered blob that has no sidecar has one regenerated, and repairs from it afterwards (verifies spec: FEC)
- [x] Regenerating over intact content reproduces the same sidecar (verifies spec: FEC)
- [x] A blob the server does not cover is refused protection (verifies spec: FEC)
- [x] Parity dies with its blob on delete (verifies spec: FEC)
- [x] Parity is discarded on demotion out of the outbox (verifies spec: FEC)

## Scrub retrofit

- [x] A store that predates error correction is brought under protection once it is switched on (verifies spec: FEC)
- [x] A second pass has nothing left to protect (verifies spec: FEC)
- [x] No parity is written while error correction is off (verifies spec: FEC)
- [x] A blob the size floor excludes is skipped (verifies spec: FEC)
- [x] A blob whose bytes no longer match its hash is not protected, so parity never encodes corruption (verifies spec: FEC)
- [x] The pass stops at its byte budget and picks the rest up next pass (verifies spec: SCRUB)

## Heal ladder, per server (real database)

### Facility

- [x] A corrupt outbox blob is repaired in place instead of quarantined, and the repair is recorded (verifies spec: FEC)
- [x] An outbox blob damaged beyond the budget is quarantined as before (verifies spec: FEC)
- [x] A corrupt cache blob is dropped to refetch, since a facility carries no parity for one (verifies spec: FEC)

### Central

- [x] Coverage is not narrowed by tier, since every copy central holds is durable (verifies spec: FEC)
- [x] A corrupt blob is repaired rather than quarantined (verifies spec: FEC)
- [x] A blob damaged beyond the budget is quarantined (verifies spec: FEC)
- [x] A blob carrying no parity is quarantined as before (verifies spec: FEC)

## Not automated

- [ ] Retrofit throughput over a store of realistic size, to confirm a scrub cycle brings an existing NTFS site under protection in an acceptable time (verifies spec: FEC)
- [ ] A repair on Windows while a reader holds the blob open, where the replacing placement has to remove the destination before the rename (verifies spec: CAS)
- [ ] Operator-facing check of the settings descriptions in the admin panel, since the parity proportion's cost is only conveyed by its help text (verifies spec: FEC)

The Windows case is the one worth doing by hand before release. The placement path
has a Windows-specific branch — POSIX renames over the destination atomically,
Windows cannot — and nothing in CI exercises it.
