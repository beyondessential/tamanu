---
id: BKFL
---

# Legacy blob backfill

Deployments that predate blob storage hold their attachment and asset bytes in
database columns, duplicated again inside historical changelog entries. The
backfill moves those bytes into the blob store: a background job that works
through the legacy rows and changelog entries at a bounded pace, at any volume
from megabytes to hundreds of gigabytes, while reads stay correct throughout.
All servers in a sync network run the same version (Tamanu rejects
minor-version sync skew), so the backfill owes no compatibility to older peers.

## The job

- [ ] Every server that holds legacy in-database blob content runs the backfill:
  the central server for attachment bytes, asset bytes, and their changelog
  entries; a facility server for the asset bytes and asset changelog entries it
  holds.
- [ ] The backfill starts automatically once the server is upgraded to the
  version that carries it, and runs to completion with no operator action.
- [ ] Work proceeds in batches with a pause between them, so the job never
  contends with clinical load for the database. The pace is adjustable at
  runtime through settings, with a conservative default.
- [ ] Progress is durable: a restart or crash resumes from where the job left
  off rather than starting over, and repeating a partially completed step is
  harmless because admission by hash is idempotent.
- [ ] Memory use is bounded regardless of volume: content is streamed a row at
  a time, never accumulated.
- [ ] Progress and completion are visible to operators, as the amount moved and
  the amount remaining.

## Moving a row

- [ ] For each reference row holding bytes, the bytes are admitted to the local
  blob store, then the row is updated to carry the content hash with the byte
  column cleared. The hash is set and the bytes cleared together, so a row is
  never observable holding neither.
- [ ] Store admission during the backfill respects the free-disk floor (see
  `capacity.md`): the store grows before the database shrinks, so when headroom
  runs out the job pauses and surfaces the condition rather than crossing the
  reserve.
- [ ] Moving a row is not itself recorded in the changelog. The row's content is
  unchanged and only its storage moves, so an entry would duplicate the one
  already there to no purpose.
- [ ] References created after the upgrade carry only a hash from the start and
  are not part of the backfill.

## Reads while the backfill runs

- [ ] A reference whose row carries a hash is served from the blob store; one
  whose row still carries bytes is served from the database column. Both forms
  coexist within the single version until the backfill completes.
- [ ] The two forms are indistinguishable to the requester: authorisation,
  streaming, and response shape are the same either way.

## Facility servers

- [ ] A facility's backfill admits its locally held asset bytes into its local
  store without modifying the rows; the row updates that set the hash and clear
  the bytes are made on central and arrive through ordinary sync. Content
  addressing makes the two converge: the facility computes the same hash from
  the same bytes, so the content is already present locally when the updated
  row arrives, with no refetch.
- [ ] An asset whose bytes are not in the facility's store when its updated row
  arrives is simply content-pending and resolves by fetch on demand (see
  `transfer.md`).
- [ ] An attachment awaiting upload when the server upgrades (bytes held locally,
  not yet pushed) is not relocated by the facility. Its record still carries its
  bytes and the push selects on synchronisation progress alone, so it reaches the
  central server inline as it did before, and the central backfill moves the
  content to the store from there. Relocating it locally would instead leave a
  hash reference to content only that facility holds, un-evictable in its cache
  for as long as the reference stood.

## Changelog entries

Historical changelog entries for attachment and asset rows carry a full copy of
the blob bytes in their row snapshot. The backfill relocates those bytes to the
store rather than leaving or discarding them.

- [ ] Each legacy changelog entry holding blob bytes is rewritten so its row
  snapshot carries the content hash in place of the bytes, the same shape as an
  entry written after the row carries only a hash.
- [ ] Entry content not already present in the store is admitted to it before
  the entry is rewritten. Content superseded on a mutable reference (an asset
  replaced by a later upload) survives only in the changelog, and this
  relocation preserves it; nothing is discarded.
- [ ] Each server rewrites the entries it holds. Changelog entries never
  re-synchronise, and the rewrite is deterministic, so every server converges
  on the same entry content independently.
- [ ] A hash carried in a changelog entry counts as a reference for
  reclamation, so relocated content is retained (see `reclamation.md`).

## Rollback

- [ ] Every byte the backfill moves remains in the blob store, so the backfill
  is reversible at any stage: rollback re-inflates the database from the store,
  restoring byte columns on rows and byte snapshots in changelog entries from
  their hashes.
- [ ] Rollback requires the store contents to be intact; it is a database
  restore from the store, not from backup.

## Completion

- [ ] The backfill is complete on a server when no reference row and no
  changelog entry on that server still holds in-database bytes.
- [ ] Completion is verified before it is reported: every hash referenced by a
  row or changelog entry is confirmed present in the local registry (on a
  facility, present or fetchable from central).
