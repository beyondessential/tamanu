---
id: FEC
---

# Blob error correction

On storage that provides no redundancy of its own, a blob can carry parity data so
that limited corruption is repaired in place, without needing another copy. Error
correction is off by default and enabled per server, chiefly for bare-metal and NTFS
deployments where the filesystem cannot repair bit rot. It is worth enabling where a
copy is effectively isolated: no reachable peer holds the same content and no fresh
backup is at hand, such as a remote facility's outbox on poor connectivity, or a
bare-metal central whose restore is a human action with downtime.

## Coverage

- [ ] Error correction is enabled per server, and covers that server's durable
  copies: every blob on the central server, and outbox blobs on a facility.
- [ ] Cache copies carry no parity. The content is durable on central and a corrupt
  cache copy costs only a refetch, so parity over it would spend disk the cache
  budget needs (see `facility-cache.md`).
- [ ] A blob admitted to the outbox has parity computed for it, and a blob demoted to
  the cache on a successful push has its parity discarded.
- [ ] A mobile device carries no parity: its durable content is small and its hashing
  budget is constrained by battery (see `mobile.md`).

## Parity

- [ ] Parity is computed from a blob's bytes and stored alongside it, sharing the
  blob's fan-out location so that it is found, replaced, and removed with the blob it
  protects. Blobs are immutable, so parity for a stored blob is computed once.
- [ ] Parity is distinguishable from content in the store's layout, so the scrub's
  reconciliation pass reads it as parity rather than as a stray blob (see
  `integrity.md`).
- [ ] Parity is computed at admission for a blob the server's coverage includes.
  Failing to write parity does not fail the admission: the blob is stored without it
  and the scrub generates it later. Storing the content is the guarantee, and parity
  is a protection over it.
- [ ] The scrub generates parity for a covered blob that has none, so enabling error
  correction on a server that already holds blobs brings that content under
  protection over a scrub cycle rather than protecting only new writes.
- [ ] The amount of parity, which is how much corruption a blob can recover from, is
  configurable as a proportion of the blob's size, and applies to parity computed
  from that point on.
- [ ] Parity occupies disk within the store, so the free-disk floor's admission check
  accounts for the parity a blob will carry as well as for the blob (see
  `capacity.md`).
- [ ] Parity is derived data and is never a fault in its own right: parity that is
  damaged or missing for a blob that verifies is regenerated.
- [ ] A store capture excludes parity, since it is regenerable from content the
  capture already carries, and a restored server regenerates it through the scrub
  (see `backups.md`).

## Repair

- [ ] Error correction is the first rung of the self-heal ladder: corruption detected
  by verification or scrub is repaired from parity where possible, before falling
  through to a peer or a backup (see `integrity.md`).
- [ ] A repair reconstructs the blob into a temporary file, verifies the
  reconstruction against the blob's hash, and moves it into place by the same atomic
  placement that admission uses, so a reader never observes a partially repaired blob
  and the corruption is corrected on disk rather than only in the bytes served.
- [ ] A blob repaired from parity is recorded verified, and is neither quarantined nor
  escalated: the content was never at risk.
- [ ] Corruption beyond what the parity can recover falls through to the rest of the
  self-heal ladder, and the blob is quarantined and escalated as it would be were no
  parity present.

## Failing-media signal

- [ ] Each repair is recorded against the blob in the registry, so the rate of
  correction over a period can be derived.
- [ ] The correction rate is surfaced as a health signal of its own, separate from
  the integrity check, because a rising correction rate calls for replacing the
  underlying media rather than for recovering content. It indicates storage that is
  beginning to fail, ahead of the point where it produces unrecoverable loss.
