---
id: FEC
---

# Blob error correction

On storage that provides no redundancy of its own, a blob can carry parity data so
that limited corruption is repaired in place, without needing another copy. Error
correction is off by default and enabled per deployment, chiefly for bare-metal and
NTFS servers where the filesystem cannot repair bit rot.

## Parity

- [ ] When enabled, each stored blob has parity data computed once, at write, and
  kept alongside it. Because blobs are immutable, parity is never recomputed.
- [ ] The amount of parity — how much corruption a blob can recover from — is
  configurable.

## Repair

- [ ] Error correction is the first rung of the self-heal ladder: corruption detected
  by verification or scrub is repaired from parity where possible, before falling
  through to a peer or a backup (see `integrity.md`).
- [ ] Corruption beyond what the parity can recover falls through to the rest of the
  self-heal ladder.

## Failing-media signal

- [ ] The rate at which parity is used to correct errors is surfaced as a health
  signal, since a rising correction rate indicates the underlying storage is
  beginning to fail before it produces unrecoverable loss.
